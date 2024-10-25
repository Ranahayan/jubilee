import stripe
import logging
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)
from authentication.utils import send_analytics_data
from billing.models import Subscription, PaymentProvider, ActiveStatus, SubscriptionHistory, ActionStatus, \
    SubscriptionPlan, SubscriptionIntervals
from billing.notifications import notify_subscription_past_due
from billing.paypal import paypal_cancel_now
from billing.shopify import graphql_cancel_subscription
from billing.history import create_shopify_end_of_trial_history, create_stripe_payment_history, \
    create_stripe_subscription_history
from django.db.models import Subquery
from django.core.management import call_command

from billing.subscriptions import cancel_subscription
from dropshipping.webhooks import change_dropshipping_suborder_status
from .metrics.trials_report import (
    fetch_data as fetch_trials_data,
    generate_chart_images,
    send_chart_images_to_slack,
)


@shared_task
def deactivate_expired_subscriptions():
    now = timezone.now()
    subscriptions_to_cancel = Subscription.objects.filter(
        cancel_at__date__lte=now.date(),
        cancelled_at__isnull=True,
        status=ActiveStatus.ACTIVE,
        external_id__isnull=False,
    )

    for sub in subscriptions_to_cancel:
        try:
            if sub.payment_provider == PaymentProvider.SHOPIFY:
                graphql_cancel_subscription(sub.shop, sub.external_id)

            elif sub.payment_provider == PaymentProvider.STRIPE:
                try:
                    stripe_subscription = stripe.Subscription.retrieve(sub.external_id)
                except Exception as e:
                    logger.error(
                        "Error in deactivate_expired_subscription: %s", str(e), exc_info=True
                    )   
                    continue   
                if stripe_subscription.status == 'canceled':
                    sub.cancelled_at = now
                    sub.status = ActiveStatus.INACTIVE
                    sub.save(update_fields=["cancelled_at", "status"])
                    continue
                else:
                    stripe.Subscription.cancel(sub.external_id)

            elif sub.payment_provider == PaymentProvider.PAYPAL:
                response = paypal_cancel_now(sub.external_id)
                if not response.ok:
                    logger.error(f"PayPal cancel failed: {response.status_code}")

            # Mark as cancelled
            sub.cancelled_at = now
            sub.status = ActiveStatus.INACTIVE
            sub.save()

        except Exception as e:
            logger.error(e)

@shared_task
def create_end_of_trial_subscription_history():
    today = timezone.now()
    subscriptions_with_trial_history = SubscriptionHistory.objects.filter(
        action=ActionStatus.ACTIVATED,
    ).values('subscription')

    subscriptions = Subscription.objects.filter(
        trial_end_at__date__lte=today.date(),
        payment_provider=PaymentProvider.SHOPIFY,
        status__in=[ActiveStatus.ACTIVE, ActiveStatus.PAUSED]
    ).exclude(id__in=Subquery(subscriptions_with_trial_history))

    subscription_history_to_create = []
    for sub in subscriptions:
        try:
            if sub.shop is not None:
                subscription_history_to_create.append(create_shopify_end_of_trial_history(sub))
        except Exception as e:
            logger.error(e)

    SubscriptionHistory.objects.bulk_create(subscription_history_to_create)
    return f"Created {len(subscription_history_to_create)} subscription histories with trial ending today."


@shared_task
def refund_felex_accounts():
    """
    Execute the refund_felex_accounts management command.
    """
    call_command('refund_felex_accounts')

@shared_task(rate_limit="1/s")
def handle_stripe_event(event):
    from billing.webhooks import change_subscription_status

    stripe_valid_status = ['active', 'trialing']

    # Handle Payment Intents to create the PaymentHistory
    if event['type'].startswith("payment_intent.") or event['type'].startswith("charge.refunded"):
        payment_intent_dict = event['data']['object']
        is_refund = False

        if event['type'] == "charge.refunded":
            is_refund = True
            payment_intent_id = payment_intent_dict['payment_intent']
            logger.info(f"[StripeWebhook] Processing refund event - Event: {event['type']}, PaymentIntent ID: {payment_intent_id}")
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        else:
            # Retrieve Stripe object for payment_intent events (webhook sends dict)
            payment_intent_id = payment_intent_dict['id']
            logger.info(f"[StripeWebhook] Processing payment_intent event - Event: {event['type']}, PaymentIntent ID: {payment_intent_id}")
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        try:
            logger.info(f"[StripeWebhook] Creating payment history - PaymentIntent: {payment_intent.id}, Amount: {payment_intent.amount}, Status: {payment_intent.status}, IsRefund: {is_refund}")
            change_dropshipping_suborder_status(payment_intent, is_refund)
            create_stripe_payment_history(payment_intent, event['type'], is_refund)
        except Exception as e:
            logger.error(f"[StripeWebhook] Error processing PaymentIntent {payment_intent.id}: {str(e)}")

    # Handle subscriptions
    if event['type'].startswith("customer.subscription."):  # .deleted .created .updated
        subscription = event['data']['object']
        status = subscription['status']
        pause_collection = subscription['pause_collection']
        external_id = subscription['id']

        try:
            sub = Subscription.objects.get(external_id=external_id)
        except Subscription.DoesNotExist:
            return

        if status == None:
            return

        if not sub.user:
            if sub.shop and sub.shop.owner:
                sub.user = sub.shop.owner
                sub.save()
            else:
                return

        if event['type'] == 'customer.subscription.updated' and not subscription['pending_update']:
            new_plan_id = subscription['plan']['id']
            if new_plan_id != sub.plan.stripe_plan_id:
                new_plan = SubscriptionPlan.objects.filter(stripe_plan_id=new_plan_id).first()

                if new_plan:
                    sub.plan = new_plan
                    sub.cancel_at = None

                    if new_plan.interval == SubscriptionIntervals.YEARLY:
                        sub.trial_end_at = None

                    sub.save()

        try:
            create_stripe_subscription_history(sub, subscription)
            if status == 'past_due':
                notify_subscription_past_due(sub)
        except Exception as e:
            logger.error(e)

        try:
            if sub.user:
                send_analytics_data(sub.user.id, 'stripe_subscription_update', {'status': status, 'email': sub.user.email})
        except Exception as e:
            logger.error(e)

        if pause_collection != None and pause_collection.get('resumes_at'):
            change_subscription_status(sub, ActiveStatus.PAUSED)

            return

        if status != 'incomplete':
            if status in stripe_valid_status and not subscription["cancel_at_period_end"]:
                # Check if we need to cancel any remaining subscriptions
                try:
                    internal_subs = Subscription.objects.filter(user=sub.user).exclude(external_id=sub.external_id)
                    for internal_sub in internal_subs:
                        cancel_subscription(internal_sub)
                except Exception as e:
                    logger.error(e)

                if not sub.user.has_created_stripe_upgrade_funnel_coupon:
                    next_plan = SubscriptionPlan.objects.filter(interval=sub.plan.interval,
                                                                status=ActiveStatus.ACTIVE,
                                                                stripe_upgrade_funnel_coupon_id__isnull=False,
                                                                stripe_upgrade_funnel_coupon_code__isnull=False,
                                                                stripe_plan_id__isnull=False,
                                                                cost_per_month__gt=sub.plan.cost_per_month
                                                                ).order_by('cost_per_month').first()

                    if next_plan is not None:
                        stripe.PromotionCode.create(coupon=next_plan.stripe_upgrade_funnel_coupon_id,
                                                    customer=sub.user.stripe_customer_id,
                                                    max_redemptions=1,
                                                    code=next_plan.stripe_upgrade_funnel_coupon_code)

                        sub.user.has_created_stripe_upgrade_funnel_coupon = True
                        sub.user.save()

                promo_code_id = cache.get(f"promo_for_sub_{sub.id}")
                if promo_code_id:
                    # Check if subscription *already* has discount
                    # If subscription["discount"] is not None, there's already a coupon in place.
                    existing_discount = subscription.get("discount")

                    if not existing_discount:
                        try:
                            # Apply the discount now that subscription is active
                            stripe.Subscription.modify(
                                sub.external_id,
                                discounts=[{'promotion_code': promo_code_id}],
                                proration_behavior='none',
                            )
                        except stripe.error.StripeError as e:
                            logger.error(e)

                    # Clear from cache so we don’t retry
                    cache.delete(f"promo_for_sub_{sub.id}")

                if subscription['canceled_at'] and abs(event['created'] - subscription['canceled_at']) > 1:
                    stripe.Subscription.modify(sub.external_id, cancel_at_period_end=False)
                change_subscription_status(sub, ActiveStatus.ACTIVE)
            elif status == 'past_due':
                change_subscription_status(sub, ActiveStatus.PAST_DUE)
            elif status == 'unpaid' and not cache.get(f"dunning_disabled"):
                print(f"handle_stripe_event_print starting dunning flow because status is {status}")
                recreate_stripe_subscription_for_unpaid_user(sub)
            elif not subscription["cancel_at_period_end"]:
                # `deactivate_expired_subscriptions` already handles the deactivation/inactivation of expired subscription
                change_subscription_status(sub, ActiveStatus.INACTIVE)

    # Handle payment failure
    if event['type'] == 'invoice.payment_failed':
        subscription_external_id = event['data']['object']['subscription']

        try:
            sub = Subscription.objects.get(external_id=subscription_external_id)
        except Subscription.DoesNotExist:
            return

    return

def recreate_stripe_subscription_for_unpaid_user(sub: Subscription):
    print(f"handle_stripe_event_print Recreating Stripe subscription for unpaid user {sub.user.email} - {sub.plan.name}")
    from billing.webhooks import change_subscription_status
    from billing.subscriptions import create_stripe_subscription

    cheapest_plan = SubscriptionPlan.objects.filter(
        status=ActiveStatus.ACTIVE, interval=SubscriptionIntervals.MONTHLY
    ).order_by('cost_per_month').first()

    if not cheapest_plan or sub.plan == cheapest_plan:
        change_subscription_status(sub, ActiveStatus.INACTIVE)
        return

    try:
        print(f"handle_stripe_event_print started update_subscription")
        schedule = stripe.SubscriptionSchedule.create(
            customer=sub.user.stripe_customer_id,
            start_date='now',
            end_behavior="cancel",
            phases=[
                {
                    "items": [{"price": cheapest_plan.stripe_plan_id, "quantity": 1}],
                    "iterations": 120,
                    "proration_behavior": "none",
                    "metadata": {
                        "dunning_downgraded": "true",
                    },
                },
            ]
        )
        customer_metadata = {
            "metadata":{
                "dunning_downgraded": "true",
            },
        }
        stripe.Customer.modify(sub.user.stripe_customer_id, **customer_metadata)
        stripe.Subscription.cancel(sub.external_id)
        Subscription.objects.create(
            user=sub.user,
            plan=cheapest_plan,
            status=ActiveStatus.INACTIVE,
            external_id=schedule.subscription,
            payment_provider=PaymentProvider.STRIPE,
        )
        change_subscription_status(sub, ActiveStatus.INACTIVE)

        print(f"handle_stripe_event_print schedule Successfully created new Stripe subscription for {sub.user.email} - {schedule.subscription}")
    except Exception as e:
        print(f"handle_stripe_event_print error {e}")
        logger.error(e)
        change_subscription_status(sub, ActiveStatus.INACTIVE)


@shared_task
def send_pdf_trials_kpi_report():
    reference_date = (timezone.now() - timezone.timedelta(days=1)).date()
    lock_key = f"trials_kpi_report_lock:{settings.APP_NAME}:{reference_date.isoformat()}"
    lock_timeout = 3600
    lock_acquired = cache.add(lock_key, "locked", lock_timeout)
    if not lock_acquired:
        return

    try:
        data = fetch_trials_data(reference_date)
        trend = data.get("trend", [])
        
        if not trend:
            logger.warning("No trend data available for trials KPI report")
            return
        
        reference_date_str = reference_date.strftime("%Y-%m-%d")
        stripe_image_path, shopify_image_path = generate_chart_images(
            trend=trend,
            reference_date_str=reference_date_str,
        )
        
        if stripe_image_path or shopify_image_path:
            send_chart_images_to_slack(
                stripe_image_path=stripe_image_path,
                shopify_image_path=shopify_image_path,
                reference_date_str=reference_date_str,
            )
        else:
            logger.warning("Failed to generate chart images for trials KPI report")
    except Exception as exc:
        logger.error("Failed to generate or send trials KPI report: %s", exc)
        cache.delete(lock_key)
        raise
