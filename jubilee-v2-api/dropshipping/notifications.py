from notifications.models import Notification, NotificationType
from datetime import datetime, timedelta

def notify_suborder_refunded(user, sub_order):
    Notification.objects.create(
        user=user,
        type=NotificationType.INFO,
        title=f"Suborder refunded",
        message=f"Your suborder from {sub_order.supplier.name} has been refunded.",
        expires_at=datetime.now() + timedelta(days=14)
    )

def notify_suborder_paid(user, sub_order):
    Notification.objects.create(
        user=user,
        type=NotificationType.SUCCESS,
        title=f"Suborder paid",
        message=f"Your suborder from {sub_order.supplier.name} has been paid.",
        expires_at=datetime.now() + timedelta(days=14)
   )
    
def notify_suborder_cancelled(user, sub_order):
    Notification.objects.create(
        user=user,
        type=NotificationType.ERROR,
        title=f"Suborder payment failed",
        message=f"The payment for your suborder from {sub_order.supplier.name} has failed. Please try again.",
        expires_at=datetime.now() + timedelta(days=14)
    )

def notify_suborder_require_action(user, sub_order, url):
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title=f"Action required for suborder",
        message=f"You need to take action to complete the payment for your suborder from {sub_order.supplier.name}.",
        primary_action_text="Complete payment",
        primary_action_url=url,
        expires_at=datetime.now() + timedelta(days=14)
    )

def send_line_item_country_not_supported_notification(user, order_name, item_name):
    """
    Notify the user that the order country is not supported.
    """
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Line Item Country Not Supported',
        message='The line item country is not supported for order {}, item {}.'.format(order_name, item_name),
        expires_at=datetime.now() + timedelta(days=14)
    )

def send_suborder_not_accepted_notification(user, order_name, supplier_name):
    """
    Notify the user that the suborder was not accepted.
    """
    Notification.objects.create(
        user=user,
        type=NotificationType.WARNING,
        title='Suborder Not Accepted',
        message='The suborder for order {} and supplier {} was not accepted because the MOQ or minimum price requirement was not met.'.format(order_name, supplier_name),
        expires_at=datetime.now() + timedelta(days=14)
    )