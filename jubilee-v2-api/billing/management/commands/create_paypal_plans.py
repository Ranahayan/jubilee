from django.core.management.base import BaseCommand
from billing import paypal

from billing.models import ActiveStatus,  SubscriptionIntervals, SubscriptionPlan


def subscription_interval_to_paypal_interval(subscription_interval: SubscriptionIntervals):
    if subscription_interval == SubscriptionIntervals.MONTHLY:
        return "MONTH"
    elif subscription_interval == SubscriptionIntervals.YEARLY:
        return "YEAR"


class Command(BaseCommand):
    help = 'Create PayPal plans for active subscription plans'

    def handle(self, *args, **options):
        if not paypal.is_paypal_configured():
            self.stdout.write(self.style.WARNING(
                "Aborting create_paypal_plans command because PayPal is not configured (you need to set the environment variables PAYPAL_BASE_URL, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET)",))
            return

        active_plans = SubscriptionPlan.objects.filter(
            status=ActiveStatus.ACTIVE)

        for plan in active_plans:
            billing_plan = paypal.create_billing_plan(plan)
            paypal.activate_billing_plan(billing_plan["id"])

            plan.paypal_plan_id = billing_plan["id"]
            plan.save()

            self.stdout.write(self.style.SUCCESS(
                f'Successfully created Paypal billing plan {billing_plan["id"]} for subscription plan {plan.id}'))
