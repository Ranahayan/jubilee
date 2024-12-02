from django.db import models
from django.conf import settings
from django.utils import timezone

class NotificationType(models.TextChoices):
    INFO = 'info', 'Info'
    SUCCESS = 'success', 'Success'
    WARNING = 'warning', 'Warning'
    ERROR = 'error', 'Error'

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.INFO)
    # Optional field for expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    # Optional field for pinning
    is_pinned = models.BooleanField(default=False)
    # Optional fields for customization
    background_color = models.CharField(max_length=7, blank=True, null=True)
    text_color = models.CharField(max_length=7, blank=True, null=True)
    icon_url = models.CharField(max_length=255, blank=True, null=True)
    # Optional fields for actions
    primary_action_text = models.CharField(max_length=255, blank=True, null=True)
    primary_action_url = models.URLField(blank=True, null=True, max_length=500)
    secondary_action_text = models.CharField(max_length=255, blank=True, null=True)
    secondary_action_url = models.URLField(blank=True, null=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
