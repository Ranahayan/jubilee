from django.conf import settings
from django.db import IntegrityError
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_save

from authentication.utils import customer_io_id
from .models import CustomUser, Shop, UserShopConnection


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

    if previous_state is None:
        return []

    for field in instance._meta.fields:
        previous_value = getattr(previous_state, field.name)
        current_value = getattr(instance, field.name)

        if previous_value != current_value and field.name in valid_fields:
            changes.append(field.name)

    del instance._previous_state
    return changes


@receiver(post_save, sender=Shop)
def create_user_shop_connection(sender, instance, created, **kwargs):
    if created:
        try:
            UserShopConnection.objects.create(
                shop_url=instance.url,
                owner=instance.owner)
        except IntegrityError:
            pass


@receiver(pre_save, sender=CustomUser)
def store_previous_product_state(sender, instance, **kwargs):
    """
        Save the previous state of the product instance for later use
    """
    save_previous_state(instance)


@receiver(post_save, sender=CustomUser)
def unsubscribe_from_customer_io(sender, instance, **kwargs):
    valid_fields = ["send_customer_io_emails"]
    changes = get_state_changes(instance, valid_fields)

    if (settings.CUSTOMER_IO
            and "send_customer_io_emails" in changes
            and instance.send_customer_io_emails is False):
        customer_id = customer_io_id(instance.id)
        settings.CUSTOMER_IO.delete(customer_id)
