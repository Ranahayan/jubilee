import json
from rest_framework.decorators import api_view
from billing import paypal
from .models import OneTimeBillingTransaction, Subscription, ActiveStatus, PaymentProvider, SubscriptionIntervals, SubscriptionPlan
from authentication.models import Shop
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from webhooks.decorators import webhook
import stripe
from .history import create_paypal_subscription_history, create_stripe_payment_history, create_stripe_subscription_history, create_shopify_subscription_history
from authentication.utils import send_analytics_data
from .notifications import notify_subscription_past_due
from dropshipping.webhooks import change_dropshipping_suborder_status
from .subscriptions import cancel_subscription
from .tasks import handle_stripe_event
import logging

logger = logging.getLogger(__name__)


def update_one_time_payment(billing_id, status):
    billing = OneTimeBillingTransaction.objects.get(billing_id=billing_id)
    order = billing.order

    if status == ActiveStatus.ACTIVE:
        pass
        # order.status = Order.OrderStatus.IN_PROGRESS
        # order.redeem_code = uuid.uuid4()
        # order.save()
        #
        # deploy_nft.delay(order.nft.id)

@webhook
def shopify_one_time_payment_update(request):
    # One time payments are currently only used for NFT minting...
    billing_id = request.webhook_data['app_purchase_one_time']['admin_graphql_api_id']
    status = ActiveStatus.ACTIVE if request.webhook_data['app_purchase_one_time']['status'] == 'ACTIVE' else ActiveStatus.INACTIVE

    update_one_time_payment(billing_id, status)

    return Response(status=200)


@webhook
def shopify_subscription_update(request):
    shop_url = request.webhook_domain
    shop = Shop.objects.get(url=shop_url)

    status = request.webhook_data['app_subscription']['status']
    external_id = request.webhook_data['app_subscription']['admin_graphql_api_id']

    try:
        sub = Subscription.objects.get(external_id=external_id)
    except Subscription.DoesNotExist:
        return Response(status=200)

    if not sub.user:
        sub.user = shop.owner
        sub.save()

    if not sub.shop:
        sub.shop = shop
        sub.save()

    if status == 'ACTIVE' and sub.status == ActiveStatus.INACTIVE:
        sub.status = ActiveStatus.ACTIVE
        sub.save()
    elif status == 'CANCELLED' or status == 'FROZEN':
        sub.status = ActiveStatus.INACTIVE
        sub.save()

    try:
        create_shopify_subscription_history(sub, request.webhook_data['app_subscription'])
    except Exception as e:
        logger.error(e)

    send_analytics_data(shop.owner.id, 'shopify_subscription_update', {'status': status, 'email': shop.owner.email})

    return Response(status=200)

stripe_valid_status = ['active', 'trialing']

def change_subscription_status(subscription: Subscription, status: ActiveStatus):
    subscription.status = status
    subscription.cancelled_at = None
    if status == ActiveStatus.PAUSED:
        subscription.paused_at = timezone.now()

    if status == ActiveStatus.INACTIVE:
        subscription.cancelled_at = timezone.now()
    subscription.save()

@api_view(['POST'])
def stripe_event_webhook(request):
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        return Response(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return Response(status=400)

    handle_stripe_event.delay(event)

    return Response(status=200)


def activate_paypal_subscription(subscription: Subscription, paypal_subscription):
    other_subscriptions_from_user = Subscription.objects.filter(
        user=subscription.user,
        status=ActiveStatus.ACTIVE
    ).exclude(id=subscription.id)

    for other_subscription in other_subscriptions_from_user:
        cancel_subscription(other_subscription)

    other_subscriptions_from_user.update(status=ActiveStatus.INACTIVE)

    change_subscription_status(subscription, ActiveStatus.ACTIVE)

    subscription.user.payment_provider = PaymentProvider.PAYPAL
    subscription.user.save()

    create_paypal_subscription_history(
        subscription, "BILLING.SUBSCRIPTION.ACTIVATED", paypal_subscription
    )


@api_view(['POST'])
def paypal_event_webhook(request):
    payload = json.loads(request.body.decode('utf-8'))

    if not paypal.is_paypal_configured():
        return Response(status=200)

    try:
        paypal.verify_webhook(payload, request.headers)
    except Exception as e:
        return Response(status=400)

    if payload["resource_type"] != 'subscription':
        # We only handle subscription events
        return Response(status=200)

    paypal_subscription = payload["resource"]
    event_type = payload["event_type"]
    subscription_external_id = paypal_subscription["id"]
    try:
        subscription = Subscription.objects.get(
            external_id=subscription_external_id)
    except Subscription.DoesNotExist:
        return Response(status=200)

    if event_type == "BILLING.SUBSCRIPTION.UPDATED":
        new_plan = SubscriptionPlan.objects.filter(
            status=ActiveStatus.ACTIVE,
            paypal_plan_id=paypal_subscription["plan_id"]
        ).first()

        if new_plan:
            subscription.plan = new_plan
            if not new_plan.trial_days:
                subscription.trial_end_at = None

            change_subscription_status(subscription, ActiveStatus.ACTIVE)

    if event_type == "BILLING.SUBSCRIPTION.RE-ACTIVATED":
        change_subscription_status(subscription, ActiveStatus.ACTIVE)

    if event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
        change_subscription_status(subscription, ActiveStatus.PAUSED)

    if event_type == "BILLING.SUBSCRIPTION.CANCELLED":
        change_subscription_status(subscription, ActiveStatus.INACTIVE)

    create_paypal_subscription_history(
        subscription, event_type, paypal_subscription)

    return Response(status=200)
