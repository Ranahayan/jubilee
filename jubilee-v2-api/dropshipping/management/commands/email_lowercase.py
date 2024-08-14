from django.core.management.base import BaseCommand
from authentication.models import CustomUser
from billing.models import ActiveStatus, Subscription
from django.db.models import Count, Func
from django.db.models import Q
import stripe

from billing.subscriptions import cancel_subscription

class Lower(Func):
    function = 'LOWER'
    template = '%(function)s(%(expressions)s)'

class Command(BaseCommand):
    help = 'Convert all CustomUser emails to lowercase and handle duplicates'

    def handle(self, *args, **options):
        email_counts = CustomUser.objects.annotate(email_lower=Lower('email')).values('email_lower').annotate(email_count=Count('email')).filter(email_count__gt=1)
        print(email_counts)
        users_to_lowercase = []
        subscription_by_user = {}

        for email_info in email_counts:
            email_lower = email_info['email_lower']
            users_with_email = CustomUser.objects.filter(email__iexact=email_lower)
            users_with_subscription = []
            for user in users_with_email:
                shop = user.shop_set.first()
                if shop:
                    subscription = Subscription.objects.filter(Q(shop=shop) | Q(user=user), status=ActiveStatus.ACTIVE).first()
                else:
                    subscription = Subscription.objects.filter(user=user, status=ActiveStatus.ACTIVE).first()

                if subscription:
                    subscription_by_user[user.id] = subscription
                    users_with_subscription.append(user)

            users_with_subscription.sort(key=lambda x: x.created_at, reverse=True)

            if len(users_with_subscription) > 1:
                # If more than one user has a subscription, get the latest
                user_with_subscription = users_with_subscription[0]
                users_to_lowercase.append(user_with_subscription)
                for user in users_with_email:
                    if user != user_with_subscription:
                        user.email = 'DEACTIVATED_' + user.email
                        try:
                            cancel_subscription(subscription_by_user.get(user.id))
                        except stripe.error.InvalidRequestError as e:
                            self.stdout.write(self.style.ERROR(f"Error cancelling subscription for user {user.id}: {str(e)}"))
                        user.is_active = False
                        user.save()
        
            elif len(users_with_subscription) == 1:
                user_with_subscription = users_with_subscription[0]
                users_to_lowercase.append(user_with_subscription)
                for user in users_with_email:
                    if user != user_with_subscription:
                        user.email = 'DEACTIVATED_' + user.email
                        user.is_active = False
                        user.save()
            else:
                # Deactivate all but the latest created user
                latest_user = users_with_email.order_by('-created_at').first()
                users_to_lowercase.append(latest_user)
                for user in users_with_email:
                    if user != latest_user:
                        user.email = 'DEACTIVATED_' + user.email
                        user.is_active = False
                        user.save()

        for user in users_to_lowercase:
            user.email = user.email.lower()
            user.save()

        self.stdout.write(self.style.SUCCESS('Successfully converted emails to lowercase and handled duplicates'))