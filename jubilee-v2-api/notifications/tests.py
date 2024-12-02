from datetime import datetime, timedelta
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(name='user', password='testpass', email='user@test.com')
        self.client.force_authenticate(user=self.user)
        self.notification = Notification.objects.create(
            user=self.user,
            title="Sample Notification",
            message="This is a test notification."
        )

        Notification.objects.create(
            user=self.user,
            title="Expired Notification",
            message="This notification is expired.",
            expires_at=datetime.now() - timedelta(days=1)
        )

        Notification.objects.create(
            user=self.user,
            title="Will Expire Soon",
            message="This notification will expire soon.",
            expires_at=datetime.now() + timedelta(days=1)
        )

    def test_get_all_notifications(self):
        url = reverse('all-notifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['title'], 'Will Expire Soon')
        self.assertEqual(response.data[1]['title'], 'Sample Notification')

    def test_mark_all_notifications_read(self):
        url = reverse('mark-all-read')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Notification.objects.first().is_read)

    def test_mark_notification_read(self):
        url = reverse('mark-read', args=[self.notification.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Notification.objects.get(id=self.notification.id).is_read)

    def tearDown(self):
        self.user.delete()
        Notification.objects.all().delete()