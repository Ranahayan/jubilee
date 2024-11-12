from django.core.management.base import BaseCommand
from billing import paypal
from billing.models import AppSetting


class Command(BaseCommand):
    help = 'Create PayPal webhooks'

    def handle(self, *args, **options):
        if not paypal.is_paypal_configured():
            self.stdout.write(self.style.WARNING(
                "Aborting create_paypal_webhooks command because PayPal is not configured (you need to set the environment variables PAYPAL_BASE_URL, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET)",))
            return

        webhook_id = paypal.create_webhooks("/webhooks/paypal/event/", [
            "BILLING.SUBSCRIPTION.UPDATED",
            "BILLING.SUBSCRIPTION.RE-ACTIVATED",
            "BILLING.SUBSCRIPTION.SUSPENDED",
            "BILLING.SUBSCRIPTION.CANCELLED",
        ])

        AppSetting.objects.update(paypal_webhook_id=webhook_id)
