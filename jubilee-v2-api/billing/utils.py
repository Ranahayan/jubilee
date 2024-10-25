from .models import SubscriptionPlan, SubscriptionIntervals, Subscription, ActiveStatus, PaymentProvider
from core.notifications import send_notification
import logging
from django.utils.timesince import timesince
from django.utils.timezone import now


def get_subscription_price_cents(plan: SubscriptionPlan):
    is_yearly = plan.interval == SubscriptionIntervals.YEARLY
    return plan.cost_per_month * (12 if is_yearly else 1)


def get_plan_name(plan: SubscriptionPlan):
    return plan.name + " - " + plan.get_interval_display()


def check_and_notify_slack(subscription: Subscription):
    # check if the shop had previous subscriptions and if it's an upgrade or downgrade
    # this function should only be called after setting the subscription as active,
    # because it will also check if the subscription is inactive and mark it as cancelled.
    subscriptions = Subscription.objects.filter(user=subscription.user).order_by('-updated_at')
    message_type = 'upgrade'

    if len(subscriptions) == 0:
        logging.error("Slack notification triggered for user with no active subscription")

    if len(subscriptions) > 1:
        old_sub = subscriptions[1]

        if get_subscription_price_cents(old_sub.plan) > get_subscription_price_cents(subscription.plan):
            # this means the user downgraded
            message_type = 'downgrade'
            send_subscription_notification(message_type, subscription.user, old_sub)
            return message_type

    if subscription.status == ActiveStatus.INACTIVE:
        message_type = 'cancellation'

    if message_type == 'upgrade':
        prefix = "annual" if subscription.plan.interval == SubscriptionIntervals.YEARLY else "monthly"
        message_type = f"{prefix}_upgrade"

    send_subscription_notification(message_type, subscription.user, subscription)
    return message_type


def send_subscription_notification(message_type, user, plan):
    data = {
        "payment_source": plan.payment_provider.capitalize(),
        "price": get_subscription_price_cents(plan.plan) / 100,
        "plan_name": plan.plan.name,
        "signup_period": timesince(user.created_at, now())
    }

    try:
        send_notification(user.email, message_type, data)
    except Exception as e:
        logging.error(f"Failed to send notification: {e}")

