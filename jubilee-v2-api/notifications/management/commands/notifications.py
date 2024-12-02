from django.core.management.base import BaseCommand
from notifications.models import Notification, NotificationType
from authentication.models import CustomUser

class Command(BaseCommand):
    help = 'Generates sample notifications for a user'
	
    def add_arguments(self, parser):
        parser.add_argument('user_email', type=str, help='Email of the user to generate notifications for')

    def handle(self, *args, **options):
        user_email = options['user_email']

        try:
            user = CustomUser.objects.get(email__iexact=user_email)
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {user_email} does not exist'))
            return
        
        Notification.objects.create(
            user=user,
            title="Sample info Notification",
            type=NotificationType.INFO,
            message="This is a sample notification message."
        )

        Notification.objects.create(
            user=user,
            title="Sample success Notification",
            type=NotificationType.SUCCESS,
            message="This is a sample notification message."
        )

        Notification.objects.create(
            user=user,
            title="Sample warning Notification",
            type=NotificationType.WARNING,
            message="This is a sample notification message."
        )

        Notification.objects.create(
            user=user,
            title="Sample error Notification",
            type=NotificationType.ERROR,
            message="This is a sample notification message."
        )

        Notification.objects.create(
            user=user,
            title="Sample sucess without message Notification",
            type=NotificationType.SUCCESS,
        )

        Notification.objects.create(
            user=user,
            title="Sample warning with primary action Notification",
            type=NotificationType.WARNING,
            primary_action_text= "Click here",
            primary_action_url= "https://www.google.com"
        )

        Notification.objects.create(
            user=user,
            title="Sample warning with primary action Notification",
            type=NotificationType.INFO,
            primary_action_text= "Cancel",
            primary_action_url= "https://www.google.com",
            secondary_action_text= "Approve",
            secondary_action_url= "https://www.google.com"
        )




