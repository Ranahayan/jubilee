import datetime
from typing import List, Literal, TypedDict
from uuid import uuid4
from django.utils import timezone
from django.conf import settings
from dateutil.relativedelta import *
import requests
import logging

from billing.constants import CURRENCY
from billing.models import ActiveStatus, AppSetting, PaymentProvider, Subscription, SubscriptionIntervals, SubscriptionPlan
from billing.utils import get_plan_name
from dropshipping.helpers import cents_to_string

logger = logging.getLogger(__name__)


def paypal_amount_to_cents(amount: str) -> int:
    return int(amount.replace(".", ""))


def is_paypal_configured():
    return settings.PAYPAL_BASE_URL is not None and settings.PAYPAL_CLIENT_ID is not None and settings.PAYPAL_CLIENT_SECRET is not None


def _get_access_token():
    response = requests.post(
        f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token",
        auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "client_credentials"}
    )

    response.raise_for_status()

    response_data = response.json()
    access_token = response_data["access_token"]

    return access_token


def _paypal_request(endpoint: str, method: Literal['GET', 'POST', 'PATCH', 'DELETE'], data: dict = None, params=None):
    access_token = _get_access_token()

    request_id = uuid4()
    url = f"{settings.PAYPAL_BASE_URL}{endpoint}"
    return requests.request(method, url, json=data, params=params, headers={
        "Authorization": f"Bearer {access_token}",
        "PayPal-Request-Id": str(request_id)
    })

def paypal_cancel_now(subscription_id: str):
    return _paypal_request(
        f"/v1/billing/subscriptions/{subscription_id}/cancel",
        "POST",
        {"reason": "Cancelled via system"}
    )


def create_product(name: str, description: str = None, image_url: str = None, home_url: str = None) -> str:
    payload = {
        "name": name,
        "type": "SERVICE",
        "category": "SOFTWARE"
    }

    if description:
        payload["description"] = description
    if image_url:
        payload["image_url"] = image_url
    if home_url:
        payload["home_url"] = home_url

    response = _paypal_request("/v1/catalogs/products", "POST", payload)
    response.raise_for_status()

    product = response.json()

    return product["id"]


class Price(TypedDict):
    currency_code: str
    value: str


class PricingScheme(TypedDict):
    fixed_price: Price


class PricingSchemeWithSequence(TypedDict):
    billing_cycle_sequence: int
    pricing_scheme: PricingScheme


class Frequency(TypedDict):
    interval_unit: Literal['DAY', 'WEEK', 'MONTH', 'YEAR']
    interval_count: int


class BillingCycle(TypedDict):
    tenure_type: Literal['REGULAR', 'TRIAL']
    total_cycles: int
    pricing_scheme: PricingScheme
    frequency: Frequency


def create_subscription(subscription: Subscription, trial_days: int):
    if trial_days:
        start_date_delta = relativedelta(days=trial_days)
        setup_fee = None

    elif subscription.plan.interval == SubscriptionIntervals.MONTHLY:
        start_date_delta = relativedelta(days=1)
        setup_fee = None

    elif subscription.plan.interval == SubscriptionIntervals.YEARLY:
        start_date_delta = relativedelta(days=1)
        setup_fee = None

    name = _plan_name(subscription.plan)

    response = _paypal_request("/v1/payments/billing-agreements", "POST", {
        "name": name,
        "description": name,
        "start_date": (datetime.datetime.now(timezone.utc) + start_date_delta).isoformat(),
        "payer": {
            "payment_method": "paypal",
            "payer_info": {"email": subscription.user.email, }
        },
        "plan": {"id": subscription.plan.paypal_plan_id},
        "override_merchant_preferences": {
            "return_url": f"{settings.FRONTEND_URL}/checkout/paypal/payment-success/{subscription.id}",
            "cancel_url": f"{settings.FRONTEND_URL}/checkout/{subscription.plan.id}",
            "setup_fee": setup_fee
        },
    })

    response.raise_for_status()

    billing_agreement = response.json()

    approve_url = next(
        (link["href"]
            for link in billing_agreement["links"] if link["rel"] == "approval_url"),
        None)

    return approve_url


def get_subscription(subscription_id: str):
    response = _paypal_request(
        f"/v1/billing/subscriptions/{subscription_id}", "GET")

    response.raise_for_status()

    return response.json()


def create_webhooks(endpoint: str, event_types: List[str]):
    response = _paypal_request("/v1/notifications/webhooks", "POST", {
        "url": f"{settings.API_URL}{endpoint}",
        "event_types": [{"name": event_type} for event_type in event_types]
    })
    response.raise_for_status()

    webhook = response.json()

    return webhook["id"]


def verify_webhook(body, headers):
    app_setting = AppSetting.objects.last()

    response = _paypal_request(
        "/v1/notifications/verify-webhook-signature",
        "POST",
        {
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_time": headers.get('paypal-transmission-time'),
            "cert_url": headers.get('paypal-cert-url'),
            "auth_algo": headers.get('paypal-auth-algo'),
            "transmission_sig": headers.get('paypal-transmission-sig'),
            "webhook_id": app_setting.paypal_webhook_id,
            "webhook_event": body
        })

    response.raise_for_status()


def update_pricing(plan_id: str, pricing_schemes: List[PricingSchemeWithSequence]):
    response = _paypal_request(
        f"/v1/billing/plans/{plan_id}/update-pricing-schemes",
        "POST",
        {"pricing_schemes": pricing_schemes}
    )

    response.raise_for_status()


def paypal_cancel_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.PAYPAL:
        raise Exception("Subscription is not a PayPal subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    if subscription.cancelled_at:
        return None
    if not is_paypal_configured():
        raise Exception("PayPal is not configured")

    now = timezone.now()
    trial_has_ended = subscription.trial_end_at is not None and subscription.trial_end_at <= now
    is_past_due = subscription.status == ActiveStatus.PAST_DUE
    should_cancel_immediately = is_past_due or trial_has_ended

    if should_cancel_immediately:
        response = paypal_cancel_now(subscription.external_id)
        if not response.ok:
            logger.error(f"PayPal cancel failed: {response.status_code}")

        subscription.cancelled_at = now
        subscription.status = ActiveStatus.INACTIVE
        subscription.save(update_fields=["cancelled_at", "status"])
    else:
        subscription.save(update_fields=["cancel_at"])


def paypal_pause_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.PAYPAL:
        raise Exception("Subscription is not a Paypal subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    if not is_paypal_configured():
        raise Exception("Paypal is not configured")

    _paypal_request(
        f"/v1/billing/subscriptions/{subscription.external_id}/suspend",
        "POST",
        {"reason": "Paused via app"}
    )


def paypal_resume_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.PAYPAL:
        raise Exception("Subscription is not a Paypal subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    if subscription.status != ActiveStatus.PAUSED:
        raise Exception("Subscription is not paused")
    if not is_paypal_configured():
        raise Exception("Paypal is not configured")

    _paypal_request(
        f"/v1/billing/subscriptions/{subscription.external_id}/activate",
        "POST",
        {"reason": "Resumed via app"}
    )


def paypal_subscription_transactions(subscription: Subscription):
    response = _paypal_request(
        f"/v1/billing/subscriptions/{subscription.external_id}/transactions",
        "GET",
        params={"start_time": subscription.created_at.isoformat(),
                "end_time": timezone.now().isoformat()
                }
    )

    response.raise_for_status()

    return response.json()


def paypal_refund(transaction_capture_id: str):
    response = _paypal_request(
        f"/v2/payments/captures/{transaction_capture_id}/refund",
        "POST",
        {}
    )

    response.raise_for_status()

    return response.json()


def paypal_get_refund(refund_id: str):
    response = _paypal_request(
        f"/v2/payments/refunds/{refund_id}",
        "GET",
    )

    response.raise_for_status()

    return response.json()


def _plan_name(plan: SubscriptionPlan):
    return f"{settings.PAYPAL_PLAN_NAME_PREFIX} {get_plan_name(plan)}"


def _amount_per_cycle(plan: SubscriptionPlan):
    cents_per_cycle = (plan.cost_per_month if plan.interval == SubscriptionIntervals.MONTHLY
                       else plan.cost_per_month * 12)

    return {"currency": CURRENCY,
            "value": cents_to_string(cents_per_cycle)}


def create_billing_plan(plan: SubscriptionPlan):
    payment_definitions = []

    if plan.trial_days > 0:
        payment_definitions.append({
            "name": f"{_plan_name(plan)} - Trial",
            "type": "TRIAL",
            "frequency_interval": plan.trial_days,
            "frequency": "DAY",
            "cycles": "1",
            "amount": {
                "currency": CURRENCY,
                "value": "0.00"
            }
        })

    payment_definitions.append({
        "name": _plan_name(plan),
        "type": "REGULAR",
        "frequency_interval": "1",
        "frequency": "MONTH" if plan.interval == SubscriptionIntervals.MONTHLY else "YEAR",
        "cycles": "0",
        "amount": _amount_per_cycle(plan)
    })

    name = _plan_name(plan)

    response = _paypal_request("/v1/payments/billing-plans", "POST", {
        "name": name,
        "description": name,
        "type": "INFINITE",
        "payment_definitions": payment_definitions,
        "merchant_preferences": {
            "return_url": f"{settings.FRONTEND_URL}/checkout/paypal/payment-success",
            "cancel_url": f"{settings.FRONTEND_URL}/checkout/{plan.id}",
        }
    })

    response.raise_for_status()

    return response.json()


def activate_billing_plan(billing_plan_id: str):
    response = _paypal_request(f"/v1/payments/billing-plans/{billing_plan_id}",
                               "PATCH",
                               [{
                                   "op": "replace",
                                   "path": "/",
                                   "value": {"state": "ACTIVE"}
                               }])

    try:
        response.raise_for_status()
    except Exception as e:
        print(response.text)
        raise e


def execute_billing_agreement(token: str):
    response = _paypal_request(
        f"/v1/payments/billing-agreements/{token}/agreement-execute", "POST")

    try:
        response.raise_for_status()
    except Exception as e:
        print(response.text)
        raise e

    return response.json()


def list_billing_agreements():
    response = _paypal_request(
        "/v1/payments/billing-plans", "GET", params={"status": "ACTIVE"})

    response.raise_for_status()

    return response.json()
