from datetime import datetime, timezone
from django.conf import settings
from django.contrib import admin
from django.utils import dateparse
from authentication.models import (
    CustomerServiceActionLog,
    CustomerServicePermissionRestrictions,
    Shop
)
from dropshipping.models import SubOrder, SubOrderStatus
import stripe
from .models import (
    ActiveStatus,
    PaymentProvider,
    PaymentHistory,
    Subscription,
    SubscriptionIntervals,
    SubscriptionPlan,
)
from django.contrib import messages
from .subscriptions import cancel_subscription, pause_subscription, resume_subscription
from .stripe import update_subscription
from .paypal import paypal_amount_to_cents, paypal_get_refund, paypal_refund, paypal_subscription_transactions
from shopify_integration.services import get_shopify_webhooks, delete_shopify_webhook
import logging

logger = logging.getLogger(__name__)


class PermissionError(Exception):
    pass


def get_start_of_day():
    return datetime.now().replace(hour=0, minute=0, second=0)


def check_user_permission(user, action, amount=0):
    """
    Check if the user has permission to perform the action.
    """
    if user.is_anonymous:
        raise PermissionError("You do not have permission to perform this action")
    if not user.is_staff:
        raise PermissionError("You do not have permission to perform this action")

    try:
        user_restrictions = CustomerServicePermissionRestrictions.objects.get(user=user)
    except CustomerServicePermissionRestrictions.DoesNotExist:
        raise PermissionError("You do not have permission to perform this action")

    logs = CustomerServiceActionLog.objects.filter(
        author=user, created_at__gte=get_start_of_day()
    )

    if action == "refund":
        logs = logs.filter(action="refund")

        total_refunded_amount = 0
        total_refunded_count = len(logs)

        for log in logs:
            total_refunded_amount += log.metadata.get("amount")

        if total_refunded_count >= user_restrictions.refund_daily_count_limit:
            raise PermissionError("You have reached the limit of refunds for today")

        if total_refunded_amount >= user_restrictions.refund_daily_limit_cents:
            raise PermissionError("You have reached the refund amount limit for today")

        if total_refunded_amount + amount >= user_restrictions.refund_daily_limit_cents:
            raise PermissionError(
                "Refunding this amount will exceed the daily refund limit"
            )

        return

    if action == "refund_order":
        logs = logs.filter(action="refund_order")
        total_refunded_amount = 0

        for log in logs:
            total_refunded_amount += log.metadata.get("amount")

        if total_refunded_amount >= user_restrictions.order_refund_daily_limit_cents:
            raise PermissionError("You have reached the refund amount limit for today")

        if (
            total_refunded_amount + amount
            >= user_restrictions.order_refund_daily_limit_cents
        ):
            raise PermissionError(
                "Refunding this amount will exceed the daily refund limit"
            )

        return

    if action == "cancel":
        logs = logs.filter(action="cancel")

        if len(logs) >= user_restrictions.plan_cancel_limit:
            raise PermissionError(
                "You have reached the limit of cancellations for today"
            )

        return

    if action == "pause":
        logs = logs.filter(action="pause")

        if len(logs) >= user_restrictions.plan_pause_limit:
            raise PermissionError("You have reached the limit of pauses for today")

        return

    if action == "downgrade":
        logs = logs.filter(action="downgrade")

        if len(logs) >= user_restrictions.plan_downgrade_limit:
            raise PermissionError("You have reached the limit of downgrades for today")

        return

    if action == "downgrade_annual":
        logs = logs.filter(action="downgrade_annual")

        if len(logs) >= user_restrictions.plan_downgrade_limit_annual:
            raise PermissionError("You have reached the limit of annual downgrades")

        return

    if action == "delete_user":
        logs = logs.filter(action="delete_user")

        if len(logs) >= user_restrictions.account_deletion_limit:
            raise PermissionError(
                "You have reached the limit of account deletions for today"
            )

        return

    raise Exception("Unknown action")


def action_refund_suborder(author, suborder: SubOrder):
    """
    Refund a suborder.
    """
    if not suborder.stripe_payment_intent_id:
        raise Exception("Suborder does not have an external ID")

    if not suborder.status == SubOrderStatus.PAID:
        raise Exception("Suborder is not paid")

    check_user_permission(author, "refund_order", suborder.total_price)

    payment_intent_id = suborder.stripe_payment_intent_id

    refund = stripe.Refund.create(
        payment_intent=payment_intent_id,
    )

    suborder.status = SubOrderStatus.REFUNDED
    suborder.save()

    if suborder.shop:
        user = suborder.shop.owner
        user_email = suborder.shop.owner.email
    else:
        user = None
        user_email = None

    CustomerServiceActionLog.objects.create(
        author=author,
        affected_user=user,
        user_email=user_email,
        action="refund_order",
        metadata={
            "amount": refund.amount,
            "suborder_id": suborder.id,
            "payment_intent": payment_intent_id,
        },
    )
    #
    # CustomerServiceActionLog.objects.create(
    #     author=author,
    #     affected_user=user,
    #     user_email=user.email,
    #     action="refund",
    #     metadata={
    #         "amount": suborder.total_price,
    #         "payment_intent": suborder.external_id,
    #     },
    # )


def refund(author, subscription: Subscription):
    """
    Refund a payment from the payment history.
    If the payment provider is Stripe, refund the payment using the external ID.
    """
    if subscription.payment_provider == PaymentProvider.STRIPE:
        if not subscription.external_id:
            raise Exception("Subscription does not have an external ID")

        stripe_subscription = stripe.Subscription.retrieve(subscription.external_id)
        last_invoice_id = stripe_subscription.get("latest_invoice")

        if not last_invoice_id:
            return Exception("No invoice found for subscription")

        invoice = stripe.Invoice.retrieve(last_invoice_id)
        payment_intent_id = invoice.get("payment_intent")

        check_user_permission(author, "refund", invoice.get("amount_paid"))

        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
        )

        CustomerServiceActionLog.objects.create(
            author=author,
            affected_user=subscription.user,
            user_email=subscription.user.email,
            action="refund",
            metadata={
                "amount": refund.amount,
                "payment_intent": payment_intent_id,
            },
        )

    elif subscription.payment_provider == PaymentProvider.PAYPAL:
        if not subscription.external_id:
            raise Exception("Subscription does not have an external ID")

        response = paypal_subscription_transactions(subscription)
        transactions = response["transactions"]
        transactions.sort(key=lambda transaction: dateparse.parse_datetime(transaction["time"]))

        if len(transactions) == 0:
            raise Exception("No transactions found for subscription")

        last_transaction = transactions[0]

        if last_transaction["status"] == "REFUNDED":
            raise Exception("Last transaction is already refunded")

        if last_transaction["status"] != "COMPLETED":
            raise Exception("Last transaction is not completed")

        last_transaction_amount = paypal_amount_to_cents(last_transaction["amount_with_breakdown"]["gross_amount"]["value"])

        check_user_permission(author, "refund", last_transaction_amount)

        refund_request = paypal_refund(transactions[0]["id"])
        refund = paypal_get_refund(refund_request["id"])

        CustomerServiceActionLog.objects.create(
            author=author,
            affected_user=subscription.user,
            user_email=subscription.user.email,
            action="refund",
            metadata={
                "amount": paypal_amount_to_cents(refund["amount"]["value"]),
            },
        )

    else:
        raise Exception(f"Payment provider ({subscription.payment_provider}) does not support refund")


def action_cancel_subscription(author, subscription: Subscription):
    """
    Cancel a subscription.
    """
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")

    check_user_permission(author, "cancel")
    cancel_subscription(subscription)

    CustomerServiceActionLog.objects.create(
        author=author,
        affected_user=subscription.user,
        user_email=subscription.user.email,
        action="cancel",
        metadata={
            "provider": subscription.payment_provider,
            "external_id": subscription.external_id,
        },
    )


def action_pause_subscription(author, subscription: Subscription):
    """
    Pause a subscription.
    """
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    
    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        raise Exception("Cannot pause Shopify subscriptions")

    check_user_permission(author, "pause")
    pause_subscription(subscription)

    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        subscription.paused_at = timezone.now()
        subscription.status = ActiveStatus.PAUSED
        subscription.save()

    CustomerServiceActionLog.objects.create(
        author=author,
        affected_user=subscription.user,
        user_email=subscription.user.email,
        action="pause",
        metadata={
            "provider": subscription.payment_provider,
            "external_id": subscription.external_id,
        },
    )


def action_resume_subscription(author, subscription: Subscription):
    """
    Resume a subscription.
    """
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")

    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        raise Exception("Cannot resume Shopify subscriptions")

    resume_subscription(subscription)

    subscription.paused_at = None
    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        subscription.status = ActiveStatus.ACTIVE
    subscription.save()

    CustomerServiceActionLog.objects.create(
        author=author,
        affected_user=subscription.user,
        user_email=subscription.user.email,
        action="resume",
        metadata={
            "provider": subscription.payment_provider,
            "external_id": subscription.external_id,
        },
    )


def extend_trial(author, subscription: Subscription):
    """
    Extends the trial of a stripe subscription.
    This code is called from the signal
    """
    if subscription.payment_provider == PaymentProvider.SHOPIFY:
        return

    if not subscription.external_id:
        return

    stripe_subscription = stripe.Subscription.retrieve(subscription.external_id)

    if not stripe_subscription.get("trial_end"):
        return

    stripe.Subscription.modify(
        subscription.external_id, trial_end=int(subscription.trial_end_at.timestamp())
    )

    CustomerServiceActionLog.objects.create(
        author=author,
        affected_user=subscription.user,
        user_email=subscription.user.email,
        action="extend_trial",
        metadata={
            "trial_end_at": subscription.trial_end_at.timestamp(),
            "external_id": subscription.external_id,
        },
    )


def get_update_plan_action(previos: SubscriptionPlan, current: SubscriptionPlan):
    """
    Get the action to perform when updating a subscription plan.
    """
    if (
        current.interval is SubscriptionIntervals.YEARLY
        and previos.interval is SubscriptionIntervals.MONTHLY
    ):
        return "upgrade_annual"

    if (
        current.interval is SubscriptionIntervals.MONTHLY
        and previos.interval is SubscriptionIntervals.YEARLY
    ):
        return "downgrade_annual"

    if current.cost_per_month > previos.cost_per_month:
        return "upgrade"
    else:
        return "downgrade"


def action_update_subscription(
    author,
    subscription: Subscription,
    previous_plan: SubscriptionPlan,
    plan: SubscriptionPlan,
):
    """
    Update the subscription to the new plan.
    """
    action = get_update_plan_action(previous_plan, plan)
    if "downgrade" in action:
        check_user_permission(author, action)

    update_subscription(subscription, subscription.plan)

    # Get the cost difference
    old_cost, new_cost = 0, 0

    if previous_plan.interval is SubscriptionIntervals.YEARLY:
        old_cost = previous_plan.cost_per_month * 12
    else:
        old_cost = previous_plan.cost_per_month
    
    if plan.interval is SubscriptionIntervals.YEARLY:
        new_cost = plan.cost_per_month * 12
    else:
        new_cost = plan.cost_per_month
    
    cost_difference = abs(new_cost - old_cost)

    CustomerServiceActionLog.objects.create(
        author=author,
        affected_user=subscription.user,
        user_email=subscription.user.email,
        action=action,
        metadata={
            "cost_difference": cost_difference,
            "external_id": subscription.external_id,
            "plan": plan.stripe_plan_id,
        },
    )


def action_delete_user(author, user):
    """
    Register the action of deleting a user.
    """
    if user.is_staff or user.is_superuser:
        raise PermissionError("You cannot delete a staff or superuser")

    check_user_permission(author, "delete_user")

    # Delete Card and Unsubscribe User from newsletter
    user.stripe_card_digits = None
    user.send_customer_io_emails = False
    user.save()

    #Unsubscribe user for shopify webhooks
    try:
        shop = Shop.objects.filter(owner=user).first()
        if shop:
            subscriptions = get_shopify_webhooks(shop)
            for subscription in subscriptions:
                callback_url = subscription["endpoint"]["callbackUrl"]
                if callback_url.startswith(settings.API_URL):
                    delete_shopify_webhook(shop, subscription["id"])
    except Exception as e:
        logger.error(e)

    CustomerServiceActionLog.objects.create(
        author=author,
        user_email=user.email,
        action="delete_user",
    )


@admin.action(description="Refund the last payment")
def refund_payment(modeladmin, request, queryset):
    sucessful_refunds = 0

    for subscription in queryset:
        try:
            refund(request.user, subscription)
            sucessful_refunds += 1
        except PaymentHistory.DoesNotExist:
            modeladmin.message_user(
                request,
                f"No payment found for subscription {subscription}",
                messages.WARNING,
            )
        except PermissionError as e:
            return modeladmin.message_user(request, str(e), messages.ERROR)
        except Exception as e:
            modeladmin.message_user(
                request, f"Error processing refund: {e}", messages.ERROR
            )

    if sucessful_refunds > 0:
        modeladmin.message_user(request, "Refund processed successfully")
    else:
        modeladmin.message_user(request, "No refunds processed", messages.WARNING)


@admin.action(description="Cancel subscription")
def cancel_subscriptions(modeladmin, request, queryset):
    sucessful_cancellations = 0

    for subscription in queryset:
        try:
            action_cancel_subscription(request.user, subscription)
            sucessful_cancellations += 1
        except PermissionError as e:
            return modeladmin.message_user(request, str(e), messages.ERROR)
        except Exception as e:
            modeladmin.message_user(
                request, f"Error processing cancellation: {e}", messages.ERROR
            )

    if sucessful_cancellations > 0:
        modeladmin.message_user(request, "Cancellation processed successfully")


@admin.action(description="Pause subscription")
def pause_subscriptions(modeladmin, request, queryset):
    sucessful_pauses = 0

    for subscription in queryset:
        try:
            action_pause_subscription(request.user, subscription)
            sucessful_pauses += 1
        except PermissionError as e:
            return modeladmin.message_user(request, str(e), messages.ERROR)
        except Exception as e:
            modeladmin.message_user(
                request, f"Error processing pause: {e}", messages.ERROR
            )

    if sucessful_pauses > 0:
        modeladmin.message_user(request, "Pause processed successfully")


@admin.action(description="Resume subscription")
def resume_subscriptions(modeladmin, request, queryset):
    sucessful_resumes = 0

    for subscription in queryset:
        try:
            action_resume_subscription(request.user, subscription)
            sucessful_resumes += 1
        except Exception as e:
            modeladmin.message_user(
                request, f"Error processing resume: {e}", messages.ERROR
            )

    if sucessful_resumes > 0:
        modeladmin.message_user(request, "Resume processed successfully")


@admin.action(description="Delete user")
def delete_user(modeladmin, request, queryset):
    sucessful_deletions = 0

    for user in queryset:
        try:
            action_delete_user(request.user, user)
            sucessful_deletions += 1
        except PermissionError as e:
            return modeladmin.message_user(request, str(e), messages.ERROR)
        except Exception as e:
            modeladmin.message_user(
                request, f"Error processing deletion: {e}", messages.ERROR
            )

    if sucessful_deletions > 0:
        modeladmin.message_user(request, "Deletion processed successfully")


@admin.action(description="Refund suborder")
def refund_suborder(modeladmin, request, queryset):
    sucessful_refunds = 0

    for suborder in queryset:
        try:
            action_refund_suborder(request.user, suborder)
            sucessful_refunds += 1
        except PermissionError as e:
            return modeladmin.message_user(request, str(e), messages.ERROR)
        except Exception as e:
            modeladmin.message_user(
                request, f"Error processing refund: {e}", messages.ERROR
            )
