from billing import paypal
from .shopify import schedule_shopify_cancel_subscription, shopify_create_subscription, shopify_pause_subscription, shopify_resume_subscription
from .stripe import stripe_cancel_subscription, stripe_create_subscription, update_subscription, stripe_pause_subscription, stripe_resume_subscription
from .paypal import paypal_cancel_subscription, paypal_pause_subscription, paypal_resume_subscription
from authentication.models import Shop, CustomUser
from django.db.models import Q
from .models import ActionStatus, SubscriptionHistory, SubscriptionPlan, Subscription, ActiveStatus, PaymentProvider
from django.utils import timezone
from stripe.error import StripeError
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def cancel_subscription(subscription: Subscription):
    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        schedule_shopify_cancel_subscription(subscription)
    elif subscription.payment_provider == PaymentProvider.STRIPE:
        stripe_cancel_subscription(subscription)
    elif subscription.payment_provider == PaymentProvider.PAYPAL:
        paypal_cancel_subscription(subscription)

def pause_subscription(subscription: Subscription):
    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        shopify_pause_subscription(subscription)
    elif subscription.payment_provider == PaymentProvider.STRIPE:
        stripe_pause_subscription(subscription)
    elif subscription.payment_provider == PaymentProvider.PAYPAL:
        paypal_pause_subscription(subscription)

def resume_subscription(subscription: Subscription):
    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        shopify_resume_subscription(subscription)
    elif subscription.payment_provider == PaymentProvider.STRIPE:
        stripe_resume_subscription(subscription)
    elif subscription.payment_provider == PaymentProvider.PAYPAL:
        paypal_resume_subscription(subscription)


def calculate_trial_time(user):
    # Filter history by user and plan with actions TRIALING, TRIAL_CANCELLED, or ACTIVATED
    histories = SubscriptionHistory.objects.filter(
        Q(action=ActionStatus.TRIALING) |
        Q(action=ActionStatus.TRIAL_CANCELLED) |
        Q(action=ActionStatus.ACTIVATED) |
        Q(action=ActionStatus.CANCELLED),
        user=user
    ).order_by('created_at')

    total_trial_time = timedelta()
    trial_start = None

    # Iterate through histories to calculate trial time
    for history in histories:
        if history.action == ActionStatus.TRIALING:
            trial_start = history.created_at

        elif history.action in [ActionStatus.TRIAL_CANCELLED, ActionStatus.ACTIVATED, ActionStatus.CANCELLED] and trial_start:
            # Calculate duration between trial start and cancellation or activation
            total_trial_time += history.created_at - trial_start
            trial_start = None  # Reset the start of the trial for the next cycle

    return total_trial_time

def get_trial_end_at(plan: SubscriptionPlan, user: CustomUser):
    """
    Returns the trial end date and the amount of days in the trial for a given plan. If the plan does not have a trial, returns None, 0.

    If the user has cancelled a subscription before, they don't get a trial.
    """
    trial_days = plan.trial_days
    trial_days = max(trial_days - calculate_trial_time(user).days, 0)

    if trial_days == 0:
        return None, 0

    return (timezone.now() + timezone.timedelta(days=trial_days)), trial_days


def create_stripe_subscription(user: CustomUser, plan: SubscriptionPlan, promo_code_id: str=None, utms: dict=None, ip_address: str = None):
    latest_subscription = Subscription.objects.filter(
        user=user,
        payment_provider=PaymentProvider.STRIPE).order_by('-created_at').first()

    if latest_subscription and latest_subscription.status != ActiveStatus.INACTIVE:
        try:
            threeDS_client_secret = update_subscription(latest_subscription, plan, promo_code_id, utms, ip_address)
            return None, threeDS_client_secret
        except StripeError as e:
            logger.error(e)

    try:
        trial_end_at, trial_days = get_trial_end_at(plan, user)
        subscription_id, threeDS_client_secret = stripe_create_subscription(
            plan, user, trial_days=trial_days, promo_code_id=promo_code_id, utms=utms, ip_address=ip_address)
        Subscription.objects.create(
            user=user,
            plan=plan,
            status=ActiveStatus.INACTIVE,
            external_id=subscription_id,
            payment_provider=PaymentProvider.STRIPE,
            trial_end_at=trial_end_at
        )
        return None, threeDS_client_secret
    except Exception as e:
        return [str(e)], None


def create_shopify_subscription(shop: Shop, plan: SubscriptionPlan):
    # Shopify does this automagically, we just receive a cancel subscription webhook (for the old one),
    # once the new subscription is created :)
    trial_end_at, trial_days = get_trial_end_at(plan, shop.owner)

    confirmation_url, user_errors, subscription_id = shopify_create_subscription(plan, shop, trial_days)
    if user_errors or not confirmation_url:
        return None, user_errors

    # Create subscription
    Subscription.objects.create(
        shop=shop,
        user=shop.owner,
        plan=plan,
        status=ActiveStatus.INACTIVE,
        external_id=subscription_id,
        payment_provider=PaymentProvider.SHOPIFY,
        trial_end_at=trial_end_at
    )

    return confirmation_url, None


def create_paypal_subscription(user: CustomUser, plan: SubscriptionPlan):
    trial_end_at, trial_days = get_trial_end_at(plan, user)

    subscription = Subscription.objects.create(
        user=user,
        plan=plan,
        status=ActiveStatus.INACTIVE,
        payment_provider=PaymentProvider.PAYPAL,
        trial_end_at=trial_end_at
    )

    payment_url = paypal.create_subscription(subscription, trial_days)

    return payment_url
