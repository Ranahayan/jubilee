import stripe
from django.core.management.base import BaseCommand
from billing.models import Subscription, PaymentProvider
from billing.utils import get_plan_name, get_subscription_price_cents
import json


class Command(BaseCommand):
    help = 'Check Stripe subscriptions after 21st of July and sync with Stripe as the source of truth'

    def handle(self, *args, **options):
        MIN_DATE = '2024-07-21'
        # fetch only active plans
        active_subs = Subscription.objects.filter(cancelled_at__isnull=False, updated_at__gt=MIN_DATE, payment_provider=PaymentProvider.STRIPE)

        for sub in active_subs:
            try:
                stripe_sub = stripe.Subscription.retrieve(sub.external_id)
                if not stripe_sub.canceled_at:
                    sub.cancelled_at = None
                    self.stdout.write(self.style.SUCCESS(f'Subscription {sub.id} is not cancelled in Stripe, updating on our end...'))
                    sub.save()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error while checking subscription {sub.id} in Stripe: {str(e)}'))
                continue

        self.stdout.write(self.style.SUCCESS('Successfully checked all subscriptions in Stripe'))