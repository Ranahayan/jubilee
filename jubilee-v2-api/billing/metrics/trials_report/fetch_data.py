from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone as dt_timezone
from typing import Dict, List, Optional, TypedDict
from concurrent.futures import ThreadPoolExecutor, as_completed

import stripe
from django.utils import timezone

from billing.models import PaymentProvider, Subscription, TrialsKPIDay
from shopify_integration.services import get_app_subscription


class ProviderSummary(TypedDict):
    provider: str
    trials_started: int
    trials_converted: int
    conversion_rate: float


class TrendPoint(TypedDict):
    date: str
    stripe_trials_started: int
    stripe_trials_converted: int
    shopify_trials_started: int
    shopify_trials_converted: int


class ReportData(TypedDict):
    reference_date: date
    provider_summaries: List[ProviderSummary]
    trend: List[TrendPoint]


@dataclass
class _DateRange:
    start: datetime
    end: datetime


def _day_range(reference_date: date) -> _DateRange:
    start = datetime.combine(reference_date, datetime.min.time()).replace(tzinfo=dt_timezone.utc)
    end = datetime.combine(reference_date, datetime.max.time()).replace(tzinfo=dt_timezone.utc)
    return _DateRange(start=start, end=end)


def _stripe_counts_for_day(reference_date: date) -> Dict[str, int]:
    day = _day_range(reference_date)

    created_gte = int((day.start - timedelta(days=7)).timestamp())
    end_ts = int(day.end.timestamp())

    trials_started = 0
    trials_converted = 0

    params: Dict[str, object] = {
        "limit": 100,
        "status": "all",
        "created": {"gte": created_gte, "lte": end_ts},
    }

    while True:
        page = stripe.Subscription.list(**params)
        data = page.get("data", []) or []

        for sub in data:
            trial_start_ts = sub.get("trial_start")
            trial_end_ts = sub.get("trial_end")
            status = sub.get("status")

            if trial_start_ts:
                trial_start = datetime.fromtimestamp(trial_start_ts, tz=dt_timezone.utc)
                if day.start <= trial_start <= day.end:
                    trials_started += 1

            if trial_end_ts:
                trial_end = datetime.fromtimestamp(trial_end_ts, tz=dt_timezone.utc)
                if day.start <= trial_end <= day.end and status in ("active", "past_due", "unpaid"):
                    trials_converted += 1

        if not page.get("has_more") or not data:
            break

        params["starting_after"] = data[-1]["id"]

    return {
        "trials_started": trials_started,
        "trials_converted": trials_converted,
    }


class _ShopifyRemoteSub(TypedDict):
    created_at: datetime
    trial_end: datetime
    status: str


def _fetch_single_subscription(sub: Subscription) -> Optional[_ShopifyRemoteSub]:
    if not sub.shop or not sub.shop.shopify_access_token:
        return None

    try:
        response = get_app_subscription(sub.shop, sub.external_id)
    except Exception:
        # Skip shops or subscriptions we cannot reach
        return None

    node = (response.get("data") or {}).get("node") or {}
    created_at_str = node.get("createdAt")
    status = node.get("status")

    if not created_at_str:
        return None

    try:
        created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
    except ValueError:
        return None

    FIXED_TRIAL_DAYS = 7
    trial_end = created_at + timedelta(days=FIXED_TRIAL_DAYS)

    return {
        "created_at": created_at,
        "trial_end": trial_end,
        "status": status or "",
    }


def _load_shopify_subscriptions(trend_start: date, trend_end: date, max_workers: int = 10) -> List[_ShopifyRemoteSub]:
    max_trial_days = 7
    lower_created_at = datetime.combine(
        trend_start - timedelta(days=max_trial_days),
        datetime.min.time(),
    ).replace(tzinfo=dt_timezone.utc)

    upper_created_at = datetime.combine(
        trend_end,
        datetime.max.time(),
    ).replace(tzinfo=dt_timezone.utc)

    shopify_subs = (
        Subscription.objects
        .select_related("shop")
        .filter(
            payment_provider=PaymentProvider.SHOPIFY,
            created_at__range=(lower_created_at, upper_created_at),
        )
        .exclude(external_id__isnull=True)
    )

    remote_subs: List[_ShopifyRemoteSub] = []

    # Use ThreadPoolExecutor to fetch subscriptions in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_sub = {
            executor.submit(_fetch_single_subscription, sub): sub
            for sub in shopify_subs
        }

        for future in as_completed(future_to_sub):
            result = future.result()
            if result is not None:
                remote_subs.append(result)

    return remote_subs


def _shopify_counts_for_day(reference_date: date, subscriptions: List[_ShopifyRemoteSub]) -> Dict[str, int]:
    day = _day_range(reference_date)

    trials_started = 0
    trials_converted = 0

    for sub in subscriptions:
        created_at = sub["created_at"]
        trial_end = sub["trial_end"]
        status = sub["status"]

        if day.start <= created_at <= day.end:
            trials_started += 1

        if day.start <= trial_end <= day.end and status == "ACTIVE":
            trials_converted += 1

    return {
        "trials_started": trials_started,
        "trials_converted": trials_converted,
    }


def fetch_data(reference_date: date) -> ReportData:
    if isinstance(reference_date, datetime):
        reference_date = reference_date.date()

    trend_start = reference_date - timedelta(days=6)
    trend_end = reference_date

    provider_summaries: List[ProviderSummary] = []

    stripe_counts = _stripe_counts_for_day(reference_date)

    shopify_remote_subs = _load_shopify_subscriptions(reference_date, reference_date)
    shopify_counts = _shopify_counts_for_day(reference_date, shopify_remote_subs)

    TrialsKPIDay.objects.update_or_create(
        date=reference_date,
        defaults={
            "stripe_trials_started": stripe_counts["trials_started"],
            "stripe_trials_converted": stripe_counts["trials_converted"],
            "shopify_trials_started": shopify_counts["trials_started"],
            "shopify_trials_converted": shopify_counts["trials_converted"],
        },
    )

    for label, counts in [
        ("Stripe", stripe_counts),
        ("Shopify", shopify_counts),
    ]:
        trials_started = counts["trials_started"]
        trials_converted = counts["trials_converted"]
        conversion_rate = (trials_converted / trials_started * 100.0) if trials_started else 0.0

        provider_summaries.append(
            {
                "provider": label,
                "trials_started": trials_started,
                "trials_converted": trials_converted,
                "conversion_rate": conversion_rate,
            }
        )

    trend: List[TrendPoint] = []

    kpi_days = TrialsKPIDay.objects.filter(
        date__range=(trend_start, trend_end)
    ).order_by("date")
    kpi_by_date = {obj.date: obj for obj in kpi_days}

    for offset in range(6, -1, -1):
        day = reference_date - timedelta(days=offset)
        kpi = kpi_by_date.get(day)

        if kpi is not None:
            stripe_started = kpi.stripe_trials_started
            stripe_converted = kpi.stripe_trials_converted
            shopify_started = kpi.shopify_trials_started
            shopify_converted = kpi.shopify_trials_converted
        else:
            stripe_started = stripe_converted = 0
            shopify_started = shopify_converted = 0

        trend.append(
            {
                "date": day.strftime("%Y-%m-%d"),
                "stripe_trials_started": stripe_started,
                "stripe_trials_converted": stripe_converted,
                "shopify_trials_started": shopify_started,
                "shopify_trials_converted": shopify_converted,
            }
        )

    _ = timezone.now()

    return {
        "reference_date": reference_date,
        "provider_summaries": provider_summaries,
        "trend": trend,
    }
