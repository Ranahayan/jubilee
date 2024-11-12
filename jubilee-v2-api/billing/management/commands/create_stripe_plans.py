import stripe
from django.core.management.base import BaseCommand
from billing.models import SubscriptionPlan, ActiveStatus
from billing.utils import get_plan_name, get_subscription_price_cents
import json


class Command(BaseCommand):
    help = 'Create Stripe plans for active subscription plans'

    def handle(self, *args, **options):
        # fetch only active plans
        active_plans = SubscriptionPlan.objects.filter(status=ActiveStatus.ACTIVE)

        for plan in active_plans:
            if plan.stripe_plan_id:
                continue
            interval = 'month' if plan.interval == 'monthly' else 'year'
            name = get_plan_name(plan)
            cost = get_subscription_price_cents(plan)

            stripe_plan = stripe.Plan.create(
                amount=cost,
                currency='usd',
                interval=interval,
                product={'name': name},
                # id=plan.id,
                metadata={
                    'features': json.dumps(plan.features),
                    'limits': json.dumps(plan.limits),
                },
                trial_period_days=plan.trial_days
            )

            plan.stripe_plan_id = stripe_plan.id
            plan.save()

            self.stdout.write(self.style.SUCCESS(f'Successfully created Stripe plan {stripe_plan.id} for subscription plan {plan.id}'))
