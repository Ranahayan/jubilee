import logging
import time
from celery import shared_task
from django.core.management import call_command
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
import stripe
from .models import Shop
from .google_analytics import GA4BigQueryClient
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)

@shared_task
def send_daily_cs_report():
    call_command("slack_cs_report")

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def backfill_shopify_ga_utms(self):
    """
    Every 6 hours:
      - Fetch installs (today + yesterday) with best-effort attribution from GA4 BigQuery export.
      - Prefer surface_type/surface_detail.
      - Fallback to parsing touch_page_referrer/touch_page_location ONLY when surface is missing.
      - Fill missing owner UTMs (do not overwrite non-empty).
      - Fill missing Stripe customer metadata (do not overwrite non-empty).
    """

    if not settings.GCP_SERVICE_ACCOUNT_JSON:
        logger.info("[ga-utm] skipped: missing GCP_SERVICE_ACCOUNT_JSON")
        return {"status": "skipped_no_gcp"}

    LOCK_KEY = "backfill_shopify_ga_utms_lock"
    LOCK_TTL_SECONDS = 60 * 60

    got_lock = cache.add(LOCK_KEY, "1", timeout=LOCK_TTL_SECONDS)
    if not got_lock:
        logger.info("[ga-utm] skipped: lock already held")
        return {"status": "skipped_locked"}

    def _yyyymmdd(d):
        return d.strftime("%Y%m%d")

    def _is_empty(v):
        return v is None or str(v).strip() == ""

    def _parse_url_params(url: str) -> dict:
        if not url:
            return {}
        try:
            q = parse_qs(urlparse(url).query)
            return {k.lower(): (v[0] if v else "") for k, v in q.items()}
        except Exception:
            return {}

    def _normalize_source(s: str) -> str:
        if not s:
            return ""
        s = s.strip().lower()
        if s in {"dropship-ai", "dropship_ai"}:
            return "dropshipai"
        return s

    def _infer_from_referrer_or_location(row: dict) -> dict:
        """
        PO rule: If surface is empty, keep UTMs "as-is" from URL/referrer.
        We do NOT reject any utm_source.
        Priority:
          1) touch_page_referrer query params
          2) touch_page_location query params
        """
        ref = (row.get("touch_page_referrer") or "").strip()
        loc = (row.get("touch_page_location") or "").strip()

        params = _parse_url_params(ref) or _parse_url_params(loc)
        if not params:
            return {"utm_source": None, "utm_medium": None, "utm_campaign": None}

        utm_source = _normalize_source(params.get("utm_source") or "")
        utm_medium = params.get("utm_medium") or None
        utm_campaign = params.get("utm_campaign") or params.get("st_campaign") or None

        # Optional: Shopify "st_campaign" with no utm_medium usually means app-store context
        if not utm_medium and params.get("st_campaign"):
            utm_medium = "shopify_app_store"

        return {
            "utm_source": utm_source or None,
            "utm_medium": utm_medium,
            "utm_campaign": utm_campaign,
        }

    started_at = timezone.now()
    try:
        today = timezone.now().date()
        yesterday = today - timezone.timedelta(days=1)

        start_suffix = _yyyymmdd(yesterday)
        end_suffix = _yyyymmdd(today)

        ga = GA4BigQueryClient()
        joined = ga.fetch_installs_with_surface_guess(
            start_suffix,
            end_suffix,
            lookback_minutes=180,
            include_intraday=True,
            limit=50000,
        )

        updated_local = 0
        updated_stripe = 0
        skipped = 0
        missing_shop = 0
        missing_owner = 0
        missing_stripe_customer = 0
        stripe_errors = 0

        for row in joined:
            shop_url = (row.get("shop_url") or "").strip().lower()
            if not shop_url:
                skipped += 1
                continue

            shop = (
                Shop.objects.filter(url__iexact=shop_url)
                .order_by("-last_updated_at")
                .select_related("owner")
                .first()
            )
            if not shop:
                shop = (
                    Shop.objects.filter(url__icontains=shop_url)
                    .order_by("-last_updated_at")
                    .select_related("owner")
                    .first()
                )
            if not shop:
                missing_shop += 1
                continue

            owner = shop.owner
            if not owner:
                missing_owner += 1
                continue

            # 1) Surface first
            surface_type = (row.get("surface_type") or "").strip()
            surface_detail = (row.get("surface_detail") or "").strip()

            utm_medium = surface_type or None
            utm_campaign = surface_detail or None

            # if surface exists, source defaults to "shopify" (but do not override owner later)
            utm_source = "shopify" if (utm_medium or utm_campaign) else None

            # 2) Fallback only when surface missing
            if _is_empty(utm_medium) and _is_empty(utm_campaign):
                inferred = _infer_from_referrer_or_location(row)

                inferred_source = inferred.get("utm_source")
                inferred_medium = inferred.get("utm_medium")
                inferred_campaign = inferred.get("utm_campaign")

                # If surface is empty and URL provides utm_source, use it.
                if inferred_source:
                    utm_source = inferred_source

                if _is_empty(utm_medium) and inferred_medium:
                    utm_medium = inferred_medium
                if _is_empty(utm_campaign) and inferred_campaign:
                    utm_campaign = inferred_campaign

            # If still nothing at all, skip
            if _is_empty(utm_source) and _is_empty(utm_medium) and _is_empty(utm_campaign):
                skipped += 1
                continue

            # 3) Update local (fill missing only)
            changed_fields = []
            if _is_empty(owner.utm_source) and not _is_empty(utm_source):
                owner.utm_source = utm_source
                changed_fields.append("utm_source")
            if _is_empty(owner.utm_medium) and not _is_empty(utm_medium):
                owner.utm_medium = utm_medium
                changed_fields.append("utm_medium")
            if _is_empty(owner.utm_campaign) and not _is_empty(utm_campaign):
                owner.utm_campaign = utm_campaign
                changed_fields.append("utm_campaign")

            if changed_fields:
                owner.save(update_fields=changed_fields + ["updated_at"])
                updated_local += 1

            # 4) Update Stripe metadata (fill missing only, and only write if changed)
            stripe_customer_id = (getattr(owner, "stripe_customer_id", None) or "").strip()
            if not stripe_customer_id:
                missing_stripe_customer += 1
                continue

            try:
                customer = stripe.Customer.retrieve(stripe_customer_id)
                metadata = dict(customer.metadata or {})

                before = dict(metadata)

                if not _is_empty(utm_source):
                    metadata["utm_source"] = utm_source
                if _is_empty(metadata.get("utm_medium")) and not _is_empty(utm_medium):
                    metadata["utm_medium"] = utm_medium
                if _is_empty(metadata.get("utm_campaign")) and not _is_empty(utm_campaign):
                    metadata["utm_campaign"] = utm_campaign

                if metadata != before:
                    stripe.Customer.modify(stripe_customer_id, metadata=metadata)
                    updated_stripe += 1

            except Exception as e:
                stripe_errors += 1
                logger.exception(
                    "[ga-utm] stripe update failed",
                    extra={
                        "stripe_customer_id": stripe_customer_id,
                        "shop_url": shop_url,
                        "utm_source": utm_source,
                        "utm_medium": utm_medium,
                        "utm_campaign": utm_campaign,
                        "touch_page_location": row.get("touch_page_location"),
                        "touch_page_referrer": row.get("touch_page_referrer"),
                        "error": str(e),
                    },
                )

        duration_s = (timezone.now() - started_at).total_seconds()
        result = {
            "status": "ok",
            "duration_s": duration_s,
            "start_suffix": start_suffix,
            "end_suffix": end_suffix,
            "fetched": len(joined),
            "updated_local": updated_local,
            "updated_stripe": updated_stripe,
            "missing_shop": missing_shop,
            "missing_owner": missing_owner,
            "missing_stripe_customer": missing_stripe_customer,
            "skipped": skipped,
            "stripe_errors": stripe_errors,
        }
        logger.info("[ga-utm] done", extra=result)
        return result

    finally:
        cache.delete(LOCK_KEY)
