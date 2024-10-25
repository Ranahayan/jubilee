from django.db.models.signals import pre_save, post_save, pre_delete
from django.dispatch import receiver
from django.forms import ValidationError

from authentication.models import PaymentProvider
from .models import Subscription, Coupon, PromotionalCode
from .actions import extend_trial, action_update_subscription
from core.middlewares.current_user_middleware import get_current_user
from .stripe import create_coupon_on_stripe, stripe

def save_previous_state(instance):
    """
    Save the previous state of the instance for later use
    """
    if instance.pk:
        state = instance.__class__.objects.get(pk=instance.pk)
        instance._previous_state = state
    else:
        instance._previous_state = None


def get_state_changes(instance, valid_fields):
    """
    Return a list of fields that changed
    """
    previous_state = instance._previous_state
    changes = []
    previous_plan = None

    if previous_state is None:
        return []

    for field in instance._meta.fields:
        previous_value = getattr(previous_state, field.name)
        current_value = getattr(instance, field.name)

        if previous_value != current_value and field.name in valid_fields:
            changes.append(field.name)

    previous_plan = instance._previous_state.plan
    del instance._previous_state
    return changes, previous_plan


@receiver(pre_save, sender=Subscription)
def store_previous_product_state(sender, instance, **kwargs):
    """
    Save the previous state of the product instance for later use
    """
    save_previous_state(instance)


@receiver(post_save, sender=Subscription)
def dispatch_product_update(sender, instance, **kwargs):
    """
    If the product changed, dispatch a task to update the product in Shopify
    """
    valid_fields = ["trial_end_at", "plan"]
    state_changes = get_state_changes(instance, valid_fields)
    if not state_changes:
        return
    changes, previous_plan = state_changes

    if changes:
        user = get_current_user()
        if user.is_anonymous:
            return
        try:
            if "trial_end_at" in changes:
                extend_trial(user, instance)

            if (
                "plan" in changes
                and instance.payment_provider == PaymentProvider.STRIPE
            ):
                action_update_subscription(user, instance, previous_plan, instance.plan)
        except Exception as e:
            raise ValidationError(e)

@receiver(post_save, sender=Coupon, dispatch_uid="create_coupon_on_stripe_signal")
def create_stripe_coupon_after_save(sender, instance, created, **kwargs):
    """
    After a new local Coupon is created, create a matching coupon on Stripe.
    """
    if created:
        try:
            create_coupon_on_stripe(instance)
        except Exception as e:
            # logger.error(f"Failed to create coupon {instance.code} on Stripe: {e}")
            pass

@receiver(pre_delete, sender=Coupon, dispatch_uid="delete_stripe_coupon")
def delete_coupon_on_stripe(sender, instance, **kwargs):
    """
    Before deleting a Coupon object, delete it on Stripe as well (if it exists).
    """
    try:
        stripe.Coupon.delete(instance.code)
    except stripe.error.InvalidRequestError as e:
        pass

@receiver(post_save, sender=PromotionalCode, dispatch_uid="promocode_stripe_hook")
def create_or_update_stripe_promotion_code(sender, instance, created, **kwargs):
    """
    - Then create the Stripe PromotionCode referencing the local coupon
    """
    if not created:
        return

    customer = None
    if instance.store and instance.store.owner:
        customer = instance.store.owner.stripe_customer_id

    try:
        stripe.PromotionCode.create(
            coupon=instance.coupon.code,
            code=instance.code,
            active=True,
            customer=customer,
        )
    except stripe.error.StripeError as e:
        pass

@receiver(pre_delete, sender=PromotionalCode, dispatch_uid="delete_stripe_promocode")
def delete_promocode_on_stripe(sender, instance, **kwargs):
    """
    Before deleting a PromotionalCode object, delete it on Stripe as well (if it exists).
    """
    try:
        stripe.PromotionCode.modify(instance.code, active=False)
    except stripe.error.InvalidRequestError as e:
        pass
