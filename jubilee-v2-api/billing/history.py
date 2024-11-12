from .models import Subscription, PaymentHistory, SubscriptionHistory, PaymentProvider, PaymentType, EntityType, PaymentStatus, SubscriptionPlan, ActionStatus, SubscriptionIntervals
from authentication.models import Shop, CustomUser
import stripe
from datetime import datetime, timedelta
from django.utils.timezone import make_aware
from shopify_integration.services import get_app_subscription
from django.utils import timezone
import time, random
import logging

logger = logging.getLogger(__name__)


def fetch_invoice(invoice_id, retries=0):
    try:
        invoice = stripe.Invoice.retrieve(invoice_id)
        return invoice
    except:
        # Rate limit reached
        if retries == 3:
            raise Exception("Rate Limit Stripe - Max retries reached")
        random_sleep = (random.randint(1, 10))/10
        time.sleep(random_sleep)
        return fetch_invoice(invoice_id, retries + 1)


def create_stripe_payment_history(payment_intent, event_type, is_refund=False):
    """
    Create a PaymentHistory object for a payment intent
    """
    payment_id = payment_intent.get("id") if isinstance(payment_intent, dict) else getattr(payment_intent, 'id', None)
    payment_type = type(payment_intent).__name__
    logger.info(f"[PaymentHistory] Processing - PaymentIntent ID: {payment_id}, Type: {payment_type}, Event: {event_type}, IsRefund: {is_refund}")
    
    invoice = None
    subscription = None
    # Handle both dict (from webhook) and Stripe object
    invoice_id = payment_intent.get("invoice") if isinstance(payment_intent, dict) else getattr(payment_intent, 'invoice', None)
    logger.info(f"[PaymentHistory] Invoice extraction - PaymentIntent: {payment_id}, Invoice ID: {invoice_id}")

    if invoice_id:
        invoice = fetch_invoice(invoice_id)
        subscription = invoice.subscription

    customer_id = payment_intent.get("customer") if isinstance(payment_intent, dict) else getattr(payment_intent, 'customer', None)
    user = CustomUser.objects.filter(stripe_customer_id=customer_id).first()
    local_subscription = Subscription.objects.filter(external_id=subscription).first()

    def get_payment_status(status):
        if status == 'succeeded':
            return PaymentStatus.SUCCESS
        elif status == 'requires_payment_method' and event_type == 'payment_intent.created':
            return PaymentStatus.PENDING
        elif status == 'canceled' or status == 'requires_payment_method':
            return PaymentStatus.FAILED
        else:
            return PaymentStatus.PENDING
    
    amount = payment_intent.get("amount") if isinstance(payment_intent, dict) else getattr(payment_intent, 'amount', None)
    status = payment_intent.get("status") if isinstance(payment_intent, dict) else getattr(payment_intent, 'status', None)
    created = payment_intent.get("created") if isinstance(payment_intent, dict) else getattr(payment_intent, 'created', None)
    
    payment_history = PaymentHistory(
        payment_provider=PaymentProvider.STRIPE,
        payment_method=user.stripe_card_digits if user else None,
        payment_type=PaymentType.REFUND if is_refund else PaymentType.PAYMENT,
        entity_type=EntityType.SUBSCRIPTION if subscription else EntityType.ONE_TIME,
        entity_external_id=subscription,
        subscription=local_subscription,
        payment_external_id=payment_id,
        invoice_external_id=invoice_id,
        invoice_pdf=invoice.invoice_pdf if invoice else None,
        amount=amount,
        status=get_payment_status(status),
        shop=None,
        user=user,
        created_at=make_aware(datetime.fromtimestamp(created)) if created else None,
    )

    payment_history.save()
    logger.info(f"[PaymentHistory] Successfully created - ID: {payment_history.id}, PaymentIntent: {payment_id}, Amount: {amount}, Status: {get_payment_status(status)}, User: {user.email if user else 'None'}")

def get_active_action(user, current_plan):
    """
    Get the action status for a subscription based on the last subscription history
    """
    valid_statuses = [
        ActionStatus.ACTIVATED,
        ActionStatus.UPGRADED,
        ActionStatus.DOWNGRADED,
        ActionStatus.PAUSED,
        ActionStatus.RESUMED,
        ActionStatus.TRIALING
    ]

    if user.payment_provider in [PaymentProvider.SHOPIFY, PaymentProvider.PAYPAL]:
        valid_statuses.append(ActionStatus.CANCELLED)

    last_sub_history = SubscriptionHistory.objects.filter(
        user=user
    ).order_by('-created_at').first()

    # Check upgrade/downgrade
    if last_sub_history and last_sub_history.plan_id != current_plan.id:
        if last_sub_history.plan.interval != current_plan.interval:
            # Different interval between plans
            if current_plan.interval == SubscriptionIntervals.YEARLY and last_sub_history.plan.interval == SubscriptionIntervals.MONTHLY:
                return ActionStatus.UPGRADED, last_sub_history.plan
            else:
                return ActionStatus.DOWNGRADED, last_sub_history.plan
        else: 
            # Same interval, different cost
            if last_sub_history.plan.cost_per_month > current_plan.cost_per_month:
                return ActionStatus.DOWNGRADED, last_sub_history.plan
            else:
                return ActionStatus.UPGRADED, last_sub_history.plan
    
    if last_sub_history and last_sub_history.action == ActionStatus.PAUSED:
        return ActionStatus.RESUMED, None

    return ActionStatus.ACTIVATED, None

def create_stripe_subscription_history(subscription: Subscription, stripe_subscription):
    """
    Create a SubscriptionHistory object for a subscription
    """
    plan_id = stripe_subscription.plan.id
    plan = SubscriptionPlan.objects.filter(stripe_plan_id=plan_id).first()
    
    if not plan:
        plan = subscription.plan
    
    
    def get_action_status(data):
        status = data.status

        if status == "cancellation_requested":
            return ActionStatus.SCHEDULED_TO_CANCEL, None

        if status == "incomplete_expired" or status == "incomplete":
            return ActionStatus.INCOMPLETE, None
        
        if status == "past_due":
            return ActionStatus.PAST_DUE, None

        if status == "canceled" or status == "unpaid":
            # check if it was a trial
            if data.get("trial_end") and data.get("canceled_at") and datetime.fromtimestamp(data.get("trial_end")) > datetime.fromtimestamp(data.get("canceled_at")):
                return ActionStatus.TRIAL_CANCELLED, None
            
            return ActionStatus.CANCELLED, None
        
        if status == "paused":
            return ActionStatus.PAUSED, None
        
        if data.pause_collection is not None:
            return ActionStatus.PAUSED, None
        
        if status == "active":
            return get_active_action(subscription.user, plan)

        if status == "trialing":
            return ActionStatus.TRIALING, None


    action, previous_plan = get_action_status(stripe_subscription)
    if action is None:
        return None
    
    start_date = stripe_subscription.start_date
    current_period_start = stripe_subscription.current_period_start
    current_period_end = stripe_subscription.current_period_end
    subscription_created_at = stripe_subscription.created
    
    subscription_to_create = SubscriptionHistory(
        action=action,
        subscription=subscription,
        plan=plan,
        previous_plan=previous_plan,
        payment_provider=PaymentProvider.STRIPE,
        start_date=make_aware(datetime.fromtimestamp(start_date)),
        period_start=make_aware(datetime.fromtimestamp(current_period_start)),
        period_end=make_aware(datetime.fromtimestamp(current_period_end)),
        subscription_created_at=make_aware(datetime.fromtimestamp(subscription_created_at)),
        shop=subscription.shop,
        user=subscription.user,
        cancelled_at=make_aware(datetime.fromtimestamp(stripe_subscription.canceled_at)) if stripe_subscription.canceled_at else None,
        trial_start=make_aware(datetime.fromtimestamp(stripe_subscription.trial_start)) if stripe_subscription.trial_start else None,
        trial_end=make_aware(datetime.fromtimestamp(stripe_subscription.trial_end)) if stripe_subscription.trial_end else None
    )

    subscription_to_create.save()


def create_shopify_subscription_history(subscription: Subscription, shopify_subscription):
    """
    Create a SubscriptionHistory object for a subscription
    """
    plan = subscription.plan
    
    def get_action_status(status, subscription: Subscription):
        if status == "ACTIVE" or status == "ACCEPTED":
            if subscription.trial_end_at and subscription.trial_end_at > timezone.now():
                return ActionStatus.TRIALING, None
            else:
                return get_active_action(subscription.user, plan)

        if status == "DECLINED" or status == "CANCELLED" or status == "EXPIRED":
            return ActionStatus.CANCELLED, None
        
        if status == "PENDING":
            return ActionStatus.INCOMPLETE, None

        if status == "FROZEN":
            return ActionStatus.PAUSED, None

    action, previous_plan = get_action_status(shopify_subscription["status"], subscription)

    if action is None:
        return None
    
    subscription_created_at = shopify_subscription["created_at"]
    current_period_start = None
    
    try:
        shopify_sub = get_app_subscription(subscription.shop, shopify_subscription["admin_graphql_api_id"])
        current_period_end = shopify_sub["data"]["node"]["currentPeriodEnd"]
        current_period_end = datetime.fromisoformat(current_period_end) if current_period_end else None

        if current_period_end:
            current_period_start = current_period_end - timedelta(days=30) if subscription.plan.interval == SubscriptionIntervals.MONTHLY else current_period_end - timedelta(days=365)
            
    except:
        current_period_end = None
    
    cancelled_at = None
    trial_start = None
    trial_end = None

    if action == ActionStatus.CANCELLED:
        cancelled_at = timezone.now()
    
    if subscription.trial_end_at:
        trial_start = subscription.created_at
        trial_end = subscription.trial_end_at

    subscription_to_create = SubscriptionHistory(
        action=action,
        subscription=subscription,
        plan=plan,
        previous_plan=previous_plan,
        payment_provider=PaymentProvider.SHOPIFY,
        start_date=datetime.fromisoformat(subscription_created_at),
        period_start=current_period_start,
        period_end=current_period_end,
        subscription_created_at=datetime.fromisoformat(subscription_created_at),
        shop=subscription.shop,
        user=subscription.shop.owner if subscription.shop else None,
        cancelled_at=cancelled_at,
        trial_start=trial_start,
        trial_end=trial_end
    )

    subscription_to_create.save()

def create_shopify_end_of_trial_history(subscription: Subscription):
    shopify_sub = get_app_subscription(subscription.shop, subscription.external_id)
    current_period_end = shopify_sub["data"]["node"]["currentPeriodEnd"]
    current_period_end = datetime.fromisoformat(current_period_end) if current_period_end else None

    subscription_history = SubscriptionHistory(
        action=ActionStatus.ACTIVATED,
        subscription=subscription,
        plan=subscription.plan,
        payment_provider=PaymentProvider.SHOPIFY,
        start_date=subscription.trial_end_at,
        period_start=subscription.trial_end_at,
        period_end=current_period_end,
        subscription_created_at=subscription.created_at,
        shop=subscription.shop,
        user=subscription.user
    )

    return subscription_history


def create_paypal_subscription_history(subscription: Subscription, event_type: str, paypal_subscription: dict):
    # We receive events from the deprecated billing agreements API (through the REST API), as well as from the Subscriptions API (through WebSockets)
    # Since they have different formats, we need to do some branching to get the data out of the object

    plan = subscription.plan

    def get_action_status():
        status = (paypal_subscription["state"] if 'state' in paypal_subscription
                  else paypal_subscription["status"] if 'status' in paypal_subscription
                  else None)

        if status is None:
            return None, None

        status = status.lower()

        if status == "cancelled":
            return ActionStatus.CANCELLED, None

        if status == "suspended" or status == "expired":
            return ActionStatus.PAUSED, None

        if status == "pending":
            return ActionStatus.INCOMPLETE, None

        if status == "active":
            get_active_action(subscription.user, plan)

        return None, None

    action, previous_plan = get_action_status()
    if action is None:
        return None

    def date_from_timestamp(timestamp: str | None):
        if timestamp is None:
            return None
        return datetime.fromisoformat(timestamp)

    def get_dates():
        if "agreement_details" in paypal_subscription:
            billing_info = paypal_subscription["agreement_details"]

            period_start = billing_info["last_payment_date"] if billing_info and "last_payment_date" in billing_info else None
            period_end = billing_info["next_billing_date"] if billing_info and "next_billing_date" in billing_info else None

            start_date = (paypal_subscription["start_date"])
            subscription_created_at = (paypal_subscription["start_date"])
            cancelled_at = datetime.now(timezone.utc)

        elif "billing_info" in paypal_subscription:
            billing_info = paypal_subscription['billing_info']

            period_start = billing_info["last_payment"]["time"] if billing_info and "last_payment" in billing_info else None
            period_end = billing_info["next_billing_time"] if billing_info and "next_billing_time" in billing_info else None
            start_date = paypal_subscription["start_time"]
            subscription_created_at = paypal_subscription["create_time"]
            cancelled_at = date_from_timestamp(
                paypal_subscription["status_update_time"])

        return (date_from_timestamp(period_start),
                date_from_timestamp(period_end),
                date_from_timestamp(start_date),
                date_from_timestamp(subscription_created_at),
                cancelled_at if event_type == "BILLING.SUBSCRIPTION.CANCELLED" else None)

    period_start, period_end, start_date, subscription_created_at, cancelled_at = get_dates()

    SubscriptionHistory.objects.create(
        action=action,
        subscription=subscription,
        plan=subscription.plan,
        previous_plan=previous_plan,
        shop=subscription.shop,
        user=subscription.user,
        payment_provider=PaymentProvider.PAYPAL,
        start_date=start_date,
        period_start=period_start,
        period_end=period_end,
        subscription_created_at=subscription_created_at,
        cancelled_at=cancelled_at,
    )
