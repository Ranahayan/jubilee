from notifications.models import Notification, NotificationType
from datetime import datetime, timedelta

def notify_subscription_past_due(subscription):
    """
    Notify the user that a subscription is past due.
    """

    Notification.objects.create(
        user=subscription.user,
        type=NotificationType.WARNING,
        title='Subscription Update Required',
        message='Your subscription is past due. Please update your payment information.',
        expires_at=datetime.now() + timedelta(days=14)
    )