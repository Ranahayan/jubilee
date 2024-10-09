import stripe
import requests
from datetime import datetime, timedelta
from decimal import Decimal

from rest_framework import status
from rest_framework.response import Response
from stripe.error import InvalidRequestError

from authentication.models import CustomUser
from .models import SubscriptionIntervals, SubscriptionPlan, Subscription, PaymentProvider, ActiveStatus, PaymentHistory, PaymentStatus
from .constants import CURRENCY, TRIAL_INITIAL_COST_CENTS
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from .models import (
    SubscriptionIntervals, SubscriptionPlan, Subscription,
    PaymentProvider, ActiveStatus, PaymentHistory, PaymentStatus,
    DiscountType, Duration, CouponRedemption
)


PLAN_KEY_TO_DB_LOOKUP = {
    "starter_monthly": {"name": "Starter", "interval": "monthly", "for_winning": False},
    "professional_monthly": {"name": "Pro", "interval": "monthly", "for_winning": False},
    "empire_monthly": {"name": "Empire", "interval": "monthly", "for_winning": False},
    "unicorn_monthly": {"name": "Unicorn", "interval": "monthly", "for_winning": False},
    "starter_winning_monthly": {"name": "Starter", "interval": "monthly", "for_winning": True},
    "professional_winning_monthly": {"name": "Pro", "interval": "monthly", "for_winning": True},
    "empire_winning_monthly": {"name": "Empire", "interval": "monthly", "for_winning": True},
    "unicorn_winning_monthly": {"name": "Unicorn", "interval": "monthly", "for_winning": True},
    "professional_annual": {"name": "Pro", "interval": "yearly", "for_winning": False},
    "empire_annual": {"name": "Empire", "interval": "yearly", "for_winning": False},
    "unicorn_annual": {"name": "Unicorn", "interval": "yearly", "for_winning": False},
}

def get_return_url():
    return f"{settings.FRONTEND_URL}/settings/plans"


def get_or_update_payment_method(payment_method_id: str, user: CustomUser):
    if user.stripe_payment_method_id:
        if user.stripe_payment_method_id != payment_method_id:
            payment_method = stripe.PaymentMethod.retrieve(payment_method_id)

            if user.stripe_customer_id:
                payment_method.attach(customer=user.stripe_customer_id)
                payment_method.save()
                customer = stripe.Customer.retrieve(user.stripe_customer_id)
                customer.invoice_settings.default_payment_method = payment_method_id
                customer.save()

            user.stripe_payment_method_id = payment_method_id
            user.stripe_card_updated_at = timezone.now()
            # Update the stripe_card_digits field with the last four digits of the card
            if 'card' in payment_method and payment_method.card:
                user.stripe_card_digits = payment_method.card.last4

            user.save()

    if not user.stripe_payment_method_id:
        user.stripe_payment_method_id = payment_method_id
        user.stripe_card_updated_at = timezone.now()
        # If there is no previous payment method, retrieve the new one and update the stripe_card_digits
        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)

        if user.stripe_customer_id:
            payment_method.attach(customer=user.stripe_customer_id)
            payment_method.save()

            customer = stripe.Customer.retrieve(user.stripe_customer_id)
            customer.invoice_settings.default_payment_method = payment_method_id
            customer.save()

        if 'card' in payment_method and payment_method.card:
            user.stripe_card_digits = payment_method.card.last4
        user.save()

    return user.stripe_payment_method_id


def get_or_create_customer(user: CustomUser, name: str = None, payment_method_id: str = None):
    if not name:
        name = user.name
    if payment_method_id:
        payment_method_id = get_or_update_payment_method(payment_method_id, user)

    # Validate existing customer ID
    if user.stripe_customer_id:
        try:
            stripe.Customer.retrieve(user.stripe_customer_id)
            return user.stripe_customer_id
        except stripe.error.InvalidRequestError:
            # Customer doesn't exist on Stripe — reset and create a new one
            user.stripe_customer_id = None
            user.save()

    if payment_method_id:
        customer = stripe.Customer.create(
            payment_method=payment_method_id,
            email=user.email,
            name=name,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )
    else:
        customer = stripe.Customer.create(
            email=user.email,
            name=name,
        )

    user.stripe_customer_id = customer['id']
    user.save()

    return customer['id']

def get_or_create_setup_price(sub_plan: SubscriptionPlan):
    plan = stripe.Plan.retrieve(sub_plan.stripe_plan_id)

    prices = stripe.Price.list(product=plan.product, active=True, unit_amount=TRIAL_INITIAL_COST_CENTS, limit=1)

    if prices.data:
        return prices.data[0]['id']

    price = stripe.Price.create(
        unit_amount=TRIAL_INITIAL_COST_CENTS,
        currency=CURRENCY,
        product=plan.product,
    )

    return price['id']

def create_one_time_payment_with_transfer(amount_cents: int, charge_description: str, user_full_name: str, payment_method_id: str, user: CustomUser, destination: str, destination_amount: int, return_url = None):
    """
        Creates a one-time payment with a transfer data.
    """
    customer_id = get_or_create_customer(user, user_full_name, payment_method_id)

    payment_intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=CURRENCY,
        customer=customer_id,
        payment_method=payment_method_id,
        statement_descriptor_suffix=charge_description,
        description=charge_description,
        confirm=True,
        on_behalf_of=destination,
        transfer_data={
            'destination': destination,
            'amount': destination_amount,
        },
        return_url=return_url if return_url != None else get_return_url(),
    )

    # Check if payment was successful
    if payment_intent.status == "succeeded":
        return payment_intent, None
    else:
        payment_error = payment_intent.last_payment_error
        return payment_intent, payment_error


def create_stripe_charge(amount_cents: int, charge_description: str, user_full_name: str, payment_method_id: str, user: CustomUser, return_url = None):
    customer_id = get_or_create_customer(user, user_full_name, payment_method_id)

    payment_intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=CURRENCY,
        customer=customer_id,
        payment_method=payment_method_id,
        statement_descriptor_suffix=charge_description,
        description=charge_description,
        return_url=return_url if return_url != None else get_return_url(),
        confirm=True
    )

    # Check if payment was successful
    if payment_intent.status == "succeeded":
        return payment_intent, None
    else:
        payment_error = payment_intent.last_payment_error
        return payment_intent, payment_error


def get_payment_method_from_setup_intent(setup_intent_id: str):
    setup_intent = stripe.SetupIntent.retrieve(setup_intent_id, expand=['payment_method'])
    return setup_intent.payment_method


def get_geo_data(ip_address):
    """Fetch geolocation data from ip-api.com"""
    if not ip_address or ip_address in ['127.0.0.1', 'localhost']:
        return {}
    
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=5)
        data = response.json()
        if data.get('status') == 'success':
            return data
    except Exception as e:
        print(f"IP-API Lookup failed: {e}")
    return {}


def stripe_create_subscription(
    subscription_plan: SubscriptionPlan, user: CustomUser, promo_code_id: str=None, trial_days=0, utms: dict=None, ip_address: str = None):
    customer_id = get_or_create_customer(user)

    subscription_data = {
        'customer': customer_id,
        'items': [{
            'plan': subscription_plan.stripe_plan_id,
        }],
        'trial_period_days': 0,
        'payment_behavior': 'default_incomplete',
        'proration_behavior': 'always_invoice',
        'expand': ['latest_invoice.payment_intent'],
        'payment_settings': {
            'save_default_payment_method': "on_subscription"
        },
    }

    if promo_code_id:
        subscription_data['discounts'] = [{'promotion_code': promo_code_id}]
        
    if not utms or not any(utms.values()):
        subscription_data['metadata'] = {
            "utm_source": getattr(user, "utm_source", "")
        }
    else:
        subscription_data['metadata'] = utms

    if subscription_plan.interval == SubscriptionIntervals.MONTHLY and trial_days != 0:
        history_199 = PaymentHistory.objects.filter(
                user=user,
                status=PaymentStatus.SUCCESS
                ).filter(
                Q(amount=199) | Q(amount=TRIAL_INITIAL_COST_CENTS)
                ).exists()
        if not history_199 and not settings.DISABLE_TRIAL_FEES:
            price_id = get_or_create_setup_price(subscription_plan)
            subscription_data['add_invoice_items'] = [{
                'price': price_id,
                'quantity': 1
            }]
            subscription_data['trial_period_days'] = trial_days
        else:
            subscription_data['trial_period_days'] = trial_days

    subscription = stripe.Subscription.create(**subscription_data)

    geo_data = get_geo_data(ip_address)
    
    utm_os_value = utms.get('utm_os', '') if utms else ""
    utm_device_value = utms.get('utm_device', '') if utms else ""
    utm_country_value = geo_data.get('country', '')
    utm_province_value = geo_data.get('regionName', '')
    
    customer_metadata = {
        "metadata": {
            "utm_os": utm_os_value,
            "utm_country": utm_country_value, 
            "utm_province": utm_province_value,
            "utm_device": utm_device_value,
        },
    }

    stripe.Customer.modify(customer_id, **customer_metadata)
    
    update_fields = []
    if utm_os_value:
        user.utm_os = utm_os_value
        update_fields.append('utm_os')
    if utm_device_value:
        user.utm_device = utm_device_value
        update_fields.append('utm_device')
    if utm_country_value:
        user.utm_country = utm_country_value
        update_fields.append('utm_country')
    if utm_province_value:
        user.utm_province = utm_province_value
        update_fields.append('utm_province')
    
    if update_fields:
        user.save(update_fields=update_fields)

    if not subscription:
        return None, None

    if subscription['status'] == 'incomplete' or subscription['status'] == 'pending' or subscription['status'] == 'past_due':
        return subscription.id, subscription['latest_invoice']['payment_intent']['client_secret']

    return subscription.id, None


def stripe_cancel_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.STRIPE:
        raise Exception("Subscription is not a Stripe subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    if subscription.cancelled_at:
        return None

    now = timezone.now()

    try:
        stripe_subscription = stripe.Subscription.retrieve(subscription.external_id)
    except InvalidRequestError as e:
        if "No such subscription" in str(e):
            # Optionally, log or handle this as a cleanup case
            subscription.status = ActiveStatus.INACTIVE
            subscription.cancelled_at = now
            subscription.save(update_fields=["status", "cancelled_at"])
            return Response({"error": "No subscription found, proceed to cancel"}, status=status.HTTP_200_OK)
        else:
            raise e

    if stripe_subscription.status == 'canceled':
        subscription.cancelled_at = now
        subscription.status = ActiveStatus.INACTIVE
        subscription.save(update_fields=["cancelled_at", "status"])
        return

    cancel_at_period_end = timezone.make_aware(datetime.fromtimestamp(stripe_subscription.current_period_end))
    trial_has_ended = (subscription.trial_end_at is not None and subscription.trial_end_at <= now)

    period_has_ended = cancel_at_period_end <= now
    is_past_due = subscription.status == ActiveStatus.PAST_DUE
    should_cancel_immediately =  is_past_due or (trial_has_ended and period_has_ended)

    if should_cancel_immediately:
        # Cancel immediately — they are overdue, out of trial, and billing period ended
        stripe.Subscription.cancel(subscription.external_id)
        subscription.cancelled_at = now
        subscription.status = ActiveStatus.INACTIVE
        subscription.save(update_fields=["cancelled_at", "status"])

    else:
        # Schedule cancellation — retain access until period ends
        stripe.Subscription.modify(stripe_subscription.id, cancel_at_period_end=True)
        subscription.cancel_at = cancel_at_period_end
        subscription.save(update_fields=["cancel_at"])


def stripe_pause_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.STRIPE:
        raise Exception("Subscription is not a Stripe subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    
    resume_at = datetime.now() + timedelta(days=30)

    stripe.Subscription.modify(
        subscription.external_id,
        pause_collection={
            'behavior': 'void',
            'resumes_at': int(resume_at.timestamp()),
        },
    )


def stripe_resume_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.STRIPE:
        raise Exception("Subscription is not a Stripe subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    if subscription.status != ActiveStatus.PAUSED:
        raise Exception("Subscription is not paused")

    stripe.Subscription.modify(
        subscription.external_id,
        pause_collection='',
    )


def update_subscription(subscription: Subscription, plan: SubscriptionPlan, promo_code_id: str=None, utms: dict=None, ip_address: str = None):
    if subscription.payment_provider != PaymentProvider.STRIPE:
        raise Exception("Subscription is not a Stripe subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    # if subscription.status != ActiveStatus.ACTIVE:
    #     raise Exception("Subscription is not active")

    current_subscription = stripe.Subscription.retrieve(subscription.external_id)
    sub_item = next((item for item in current_subscription['items']['data'] if item['plan']['id'] == subscription.plan.stripe_plan_id), None)
    if not sub_item and len(current_subscription['items']['data']) > 0:
        sub_item = current_subscription['items']['data'][0]
    subscription_data = {
        "items": [{"id": sub_item['id'], "price": plan.stripe_plan_id}],
        "proration_behavior": "always_invoice",
        'payment_behavior': 'pending_if_incomplete',
        'expand': ['latest_invoice.payment_intent'],
    }

    if promo_code_id:
        subscription_data['discounts'] = [{'promotion_code': promo_code_id}]

    if plan.interval == SubscriptionIntervals.YEARLY:
        subscription_data['trial_end'] = "now"
        subscription.trial_end_at = None
    
    if utms:
        subscription_data['metadata'] = utms

    # Update subscription plan with the new plan (prorations will be automatically handled by Stripe)
    stripe_sub = stripe.Subscription.modify(subscription.external_id, **subscription_data)
    
    if utms or ip_address:
        geo_data = get_geo_data(ip_address)
        
        utm_os_value = utms.get('utm_os', '') if utms else ""
        utm_device_value = utms.get('utm_device', '') if utms else ""
        utm_country_value = geo_data.get('country', '')
        utm_province_value = geo_data.get('regionName', '')
        
        customer_metadata = {
            "metadata": {
                "utm_os": utm_os_value,
                "utm_country": utm_country_value, 
                "utm_province": utm_province_value,
                "utm_device": utm_device_value,
            },
        }

        stripe.Customer.modify(subscription.user.stripe_customer_id, **customer_metadata)
        
        update_fields = []
        if utm_os_value:
            subscription.user.utm_os = utm_os_value
            update_fields.append('utm_os')
        if utm_device_value:
            subscription.user.utm_device = utm_device_value
            update_fields.append('utm_device')
        if utm_country_value:
            subscription.user.utm_country = utm_country_value
            update_fields.append('utm_country')
        if utm_province_value:
            subscription.user.utm_province = utm_province_value
            update_fields.append('utm_province')
        
        if update_fields:
            subscription.user.save(update_fields=update_fields)

    latest_invoice = stripe_sub['latest_invoice'] if 'latest_invoice' in stripe_sub else None
    latest_payment_intent = latest_invoice['payment_intent'] if latest_invoice and 'payment_intent' in latest_invoice else None
    latest_payment_intent_status = latest_payment_intent['status'] if latest_payment_intent and 'status' in latest_payment_intent else None
    if stripe_sub['status'] in ['incomplete', 'pending', 'past_due'] or latest_payment_intent_status in ['requires_action', 'requires_payment_method']:
        return stripe_sub['latest_invoice']['payment_intent']['client_secret']

    return None


def get_proration_value(subscription: Subscription, plan: SubscriptionPlan, user: CustomUser, promo_code_id: str=None):
    if subscription.payment_provider != PaymentProvider.STRIPE:
        return None
    if not subscription.external_id:
        return None
    if subscription.status != ActiveStatus.ACTIVE:
        return None
    if subscription.trial_end_at and subscription.trial_end_at > timezone.now() and plan.interval == SubscriptionIntervals.YEARLY:
        return {"total": plan.cost_per_month * 12}

    current_subscription = stripe.Subscription.retrieve(subscription.external_id)

    items=[{'id': current_subscription['items']['data'][0].id, 'price': plan.stripe_plan_id}]

    invoice = stripe.Invoice.upcoming(
        customer=user.stripe_customer_id,
        subscription=subscription.external_id,
        subscription_items=items,
        subscription_proration_date=int(timezone.now().timestamp()),
    )

    if plan.interval == subscription.plan.interval:
        line_items = [item for item in invoice.lines.data if item.proration]
    else:
        line_items = invoice.lines.data

    proration_value = sum([item.amount for item in line_items])

    percent_off = 0
    if promo_code_id:
        try:
            promo_code = stripe.PromotionCode.retrieve(promo_code_id)
            percent_off = promo_code.coupon.percent_off
        except:
            pass

    proration_value = proration_value - (proration_value * percent_off / 100)
    payload = {"total": proration_value if proration_value > 0 else 0}

    return payload


def create_stripe_setup_intent(user):
    customer_id = get_or_create_customer(user)

    setup_intent = stripe.SetupIntent.create(
        customer=customer_id,
        payment_method_types=['card'],
        payment_method_options={'card': {'request_three_d_secure': 'any'}},
    )

    return setup_intent.client_secret

def create_coupon_on_stripe(coupon):
    """
    Create a Stripe coupon, using the local `coupon` model fields.
    """
    params = {
        "id": coupon.code,
        "name": coupon.name,
        "duration": coupon.duration,
    }

    if coupon.discount_type == DiscountType.PERCENT:
        # e.g. discount_value=25 => 25% off
        params["percent_off"] = float(coupon.discount_value)
    else:
        # discount_type == fixed_cents => discount_value in “dollars”
        amount_off_cents = int(Decimal(coupon.discount_value) * 100)
        params["amount_off"] = amount_off_cents
        params["currency"] = "usd"

    if coupon.duration == Duration.REPEATING and coupon.duration_in_months:
        params["duration_in_months"] = coupon.duration_in_months

    if coupon.max_redemptions:
        params["max_redemptions"] = coupon.max_redemptions

    if coupon.expires_at:
        params["redeem_by"] = int(coupon.expires_at.timestamp())

    if coupon.metadata:
        params["metadata"] = coupon.metadata

    product_ids = set()

    for plan_key, val in coupon.plans.items():
        if val == "1":  # means it's checked
            lookup = PLAN_KEY_TO_DB_LOOKUP.get(plan_key)
            if not lookup:
                continue
            try:
                subs_plan = SubscriptionPlan.objects.get(
                    name=lookup["name"],
                    interval=lookup["interval"],
                    status="AC",
                    for_winning=lookup["for_winning"]
                )
            except SubscriptionPlan.DoesNotExist:
                continue

            if not subs_plan.stripe_plan_id:
                continue

            # fetch plan from Stripe to get the product
            try:
                stripe_plan = stripe.Plan.retrieve(subs_plan.stripe_plan_id)
                if stripe_plan.product:
                    product_ids.add(stripe_plan.product)
            except stripe.error.StripeError:
                pass
    if product_ids:
        params["applies_to"] = {"products": list(product_ids)}

    stripe_coupon = stripe.Coupon.create(**params)
    return stripe_coupon

def apply_coupon_on_stripe(subscription, coupon_code):
    """
    1) Updates the Stripe Subscription with `coupon=coupon_code`
    2) Creates a local CouponRedemption
    """
    if subscription.payment_provider != PaymentProvider.STRIPE:
        raise ValueError("Not a Stripe subscription")
    if not subscription.external_id:
        raise ValueError("Subscription has no external_id in Stripe")

    cancel_at_period_end = subscription.cancel_at is not None and subscription.cancel_at > timezone.now()

    stripe.Subscription.modify(
        subscription.external_id,
        coupon=coupon_code,
        cancel_at_period_end=cancel_at_period_end,
    )

    CouponRedemption.objects.create(
        redeemable_id=subscription.id,
        redeemable_type="Subscription",
        store=subscription.shop,
        subscription_id=subscription.plan,
        subscription_type=subscription.plan.interval,
    )

def list_stripe_coupons_for_subscription(subscription):
    all_coupons = []
    params = {"limit": 100}
    while True:
        response = stripe.Coupon.list(**params)
        all_coupons.extend(response.data)
        if not response.has_more:
            break
        params["starting_after"] = response.data[-1].id

    # filtering only coupons for cs_usage
    filtered = []
    for c in all_coupons:
        if c.metadata.get("cs_usage") == "true":
            filtered.append(c)

    return filtered