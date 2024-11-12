from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from billing.models import PaymentHistory, SubscriptionHistory, ActionStatus, PaymentType, EntityType, PaymentStatus, PaymentProvider, SubscriptionPlan, SubscriptionIntervals, Subscription
from authentication.models import CustomUser, Shop
from datetime import datetime
import stripe
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from django.utils.timezone import make_aware

stripe.api_key = settings.STRIPE_KEY

def get_payment_status(status):
    if status == 'succeeded':
        return PaymentStatus.SUCCESS
    elif status == 'canceled' or status == 'requires_payment_method':
        return PaymentStatus.FAILED
    else:
        return PaymentStatus.PENDING

class Command(BaseCommand):
    help = 'Populate the billing history from the Stripe API'

    def fetch_all_events(self, event_type):
        events = []
        last_object = None

        while True:
            if last_object is None:
                response = stripe.Event.list(limit=100, type=event_type)
            else:
                response = stripe.Event.list(limit=100, type=event_type, starting_after=last_object)
            
            events.extend(response.data)
            if not response.has_more:
                break

            last_object = events[-1].id

        return events

    def fetch_all_refunds(self):
        refunds = []
        last_object_id = None

        while True:
            if last_object_id is None:
                response = stripe.Refund.list(limit=100)
            else:
                response = stripe.Refund.list(limit=100, starting_after=last_object_id)

            refunds.extend(response.data)
            if not response.has_more:
                break

            last_object_id = refunds[-1].id

        return refunds
    
    def fetch_all_payment_intents(self):
        payment_intents = []
        last_object_id = None

        while True:
            if last_object_id is None:
                response = stripe.PaymentIntent.list(limit=100)
            else:
                response = stripe.PaymentIntent.list(limit=100, starting_after=last_object_id)

            payment_intents.extend(response.data)

            if not response.has_more:
                break

            last_object_id = payment_intents[-1].id

        return payment_intents
    
    def fetch_all_subscriptions(self):
        subscriptions = []
        last_object_id = None

        while True:
            if last_object_id is None:
                response = stripe.Subscription.list(limit=100)
            else:
                response = stripe.Subscription.list(limit=100, starting_after=last_object_id)

            subscriptions.extend(response.data)

            if not response.has_more:
                break

            last_object_id = subscriptions[-1].id

        return subscriptions

    def get_stripe_subscription_by_customer(self, customer_id):
        subscriptions = stripe.Subscription.list(customer=customer_id)

        if len(subscriptions.data) > 0:
            subscription = subscriptions.data[0]
            return subscription.id

        return None

    def payment_history_from_payment_intent(self):
        self.stdout.write(self.style.WARNING("Fetching payment intents..."))
        payment_intents = self.fetch_all_payment_intents()
        self.stdout.write(self.style.SUCCESS(f"Successfully fetched {len(payment_intents)} payment intents"))

        payment_history_to_create = []
        
        def process_payment_intent(payment_intent):
            invoice = None
            subscription = None
            invoice_id = payment_intent.invoice

            if invoice_id:
                try:
                    invoice = stripe.Invoice.retrieve(invoice_id)
                    subscription = invoice["subscription"]
                except Exception as e:
                    print(e)
            elif not payment_intent.transfer_data:
                subscription = self.get_stripe_subscription_by_customer(payment_intent.customer)
                
            shop = None
            user = CustomUser.objects.filter(stripe_customer_id=payment_intent.customer).first()
            if user:
                shop = Shop.objects.filter(owner=user).first()

            local_subscription = Subscription.objects.filter(external_id=subscription).first()

            payment_history = PaymentHistory(
                payment_provider=PaymentProvider.STRIPE,
                payment_type=PaymentType.PAYMENT,
                entity_type=EntityType.SUBSCRIPTION if subscription else EntityType.ONE_TIME,
                entity_external_id=subscription,
                subscription=local_subscription,
                payment_external_id=payment_intent.id,
                invoice_external_id=invoice_id,
                invoice_pdf=invoice.invoice_pdf if invoice else None,
                amount=payment_intent.amount,
                status=get_payment_status(payment_intent.status),
                created_at=make_aware(datetime.fromtimestamp(payment_intent.created)),
                shop=shop,
                user=user
            )

            return payment_history

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(process_payment_intent, payment_intent) for payment_intent in payment_intents]
            for future in tqdm(as_completed(futures), total=len(payment_intents), desc="Processing payment intents"):
                payment_history = future.result()
                if payment_history:
                    payment_history_to_create.append(payment_history)

        PaymentHistory.objects.bulk_create(payment_history_to_create)
        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(payment_history_to_create)} payment histories"))

    def payment_history_from_refund(self):
        self.stdout.write(self.style.WARNING("Fetching refunds..."))
        refunds = self.fetch_all_refunds()
        self.stdout.write(self.style.SUCCESS(f"Successfully fetched {len(refunds)} refunds"))
        payment_history_to_create = []

        def process_refund(refund):
            invoice = None
            subscription = None
            payment_intent = None
            charge = None
            customer = None

            if not refund.status == "succeeded":
                return None
            
            if refund["payment_intent"]:
                payment_intent = stripe.PaymentIntent.retrieve(refund["payment_intent"])
                invoice_id = payment_intent["invoice"]
                customer = payment_intent["customer"]
            else:
                charge = stripe.Charge.retrieve(refund["charge"])
                invoice_id = charge["invoice"]
                customer = charge["customer"]

            if invoice_id:
                try:
                    invoice = stripe.Invoice.retrieve(invoice_id)
                    subscription = invoice["subscription"]
                except Exception as e:
                    print(e)
            else:
                if customer:
                    subscription = self.get_stripe_subscription_by_customer(customer)

            shop = None
            stripe_customer_id = payment_intent.customer if payment_intent else charge.customer
            user = CustomUser.objects.filter(stripe_customer_id=stripe_customer_id).first()
            
            if user:
                shop = Shop.objects.filter(owner=user).first()

            local_subscription = Subscription.objects.filter(external_id=subscription).first()

            payment_history = PaymentHistory(
                payment_provider=PaymentProvider.STRIPE,
                payment_type=PaymentType.REFUND,
                entity_type=EntityType.SUBSCRIPTION if subscription else EntityType.ONE_TIME,
                entity_external_id=subscription,
                subscription=local_subscription,
                payment_external_id=payment_intent.id if payment_intent else charge.id,
                invoice_external_id=invoice_id,
                invoice_pdf=invoice.invoice_pdf if invoice else None,
                amount=refund["amount"],
                status=PaymentStatus.SUCCESS,
                created_at=make_aware(datetime.fromtimestamp(refund["created"])),
                shop=shop,
                user=user
            )

            return payment_history

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(process_refund, refund) for refund in refunds]
            for future in tqdm(as_completed(futures), total=len(refunds), desc="Processing refunds"):
                payment_history = future.result()
                if payment_history:
                    payment_history_to_create.append(payment_history)
        
        PaymentHistory.objects.bulk_create(payment_history_to_create)
        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(payment_history_to_create)} payment histories from refunds"))

    def get_action_status(self, data):
        status = data["status"]

        if status == "cancellation_requested":
            return ActionStatus.SCHEDULED_TO_CANCEL

        if status == "active":
            return ActionStatus.ACTIVATED

        if status == "trialing":
            return ActionStatus.TRIALING

        if status == "incomplete_expired" or status == "incomplete":
            return ActionStatus.INCOMPLETE
        
        if status == "past_due":
            return ActionStatus.PAST_DUE

        if status == "canceled" or status == "unpaid":
            # check if it was a trial
            if data.get("trial_end") and data.get("canceled_at") and datetime.fromtimestamp(data.get("trial_end")) > datetime.fromtimestamp(data.get("canceled_at")):
                return ActionStatus.TRIAL_CANCELLED
            
            return ActionStatus.CANCELLED

    def subscription_history(self):
        self.stdout.write(self.style.WARNING("Fetching subscriptions..."))
        subscriptions = self.fetch_all_events("customer.subscription.*")
        self.stdout.write(self.style.SUCCESS(f"Successfully fetched {len(subscriptions)} subscriptions"))
        subscription_history_to_create = []

        def process_subscription(event):
            plan_id = event["data"]["object"]["items"]["data"][0]["plan"]["id"]
            plan = SubscriptionPlan.objects.filter(stripe_plan_id=plan_id).first()
            subscription_id = event["data"]["object"]["id"]

            local_subscription = Subscription.objects.filter(external_id=subscription_id).first()

            if not local_subscription and plan:
                local_subscription, _ = Subscription.objects.get_or_create(
                    external_id=subscription_id,
                    defaults={
                        'payment_provider': PaymentProvider.STRIPE,
                        'plan': plan,
                        'shop': None,
                        'created_at': make_aware(datetime.fromtimestamp(event["data"]["object"]["created"])),
                    }
                )

            action = self.get_action_status(event["data"]["object"])
            if action is None:
                return None

            shop = None
            user = CustomUser.objects.filter(stripe_customer_id=event["data"]["object"]["customer"]).first()
            if user:
                shop = Shop.objects.filter(owner=user).first()

            start_date = event["data"]["object"]["start_date"]
            current_period_start = event["data"]["object"]["current_period_start"]
            current_period_end = event["data"]["object"]["current_period_end"]
            subscription_created_at = event["data"]["object"]["created"]
            created = event["created"]
            canceled_at = event["data"]["object"]["canceled_at"]
            trial_start = event["data"]["object"]["trial_start"]
            trial_end = event["data"]["object"]["trial_end"]

            subscription_to_create = SubscriptionHistory(
                action=action,
                subscription=local_subscription,
                plan=plan,
                previous_plan=None,
                payment_provider=PaymentProvider.STRIPE,
                start_date=make_aware(datetime.fromtimestamp(start_date)),
                period_start=make_aware(datetime.fromtimestamp(current_period_start)),
                period_end=make_aware(datetime.fromtimestamp(current_period_end)),
                subscription_created_at=make_aware(datetime.fromtimestamp(subscription_created_at)),
                created_at=make_aware(datetime.fromtimestamp(created)),
                shop=shop,
                user=user,
                cancelled_at=make_aware(datetime.fromtimestamp(canceled_at)) if canceled_at else None,
                trial_start=make_aware(datetime.fromtimestamp(trial_start)) if trial_start else None,
                trial_end=make_aware(datetime.fromtimestamp(trial_end)) if trial_end else None
            )

            return subscription_to_create
        
        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(process_subscription, subscription) for subscription in subscriptions]
            for future in tqdm(as_completed(futures), total=len(subscriptions), desc="Processing subscriptions"):
                subscription_history = future.result()
                if subscription_history:
                    subscription_history_to_create.append(subscription_history)

        SubscriptionHistory.objects.bulk_create(subscription_history_to_create)
        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(subscription_history_to_create)} subscription histories"))

    def handle(self, *args, **options):
        self.MAX_WORKERS = 16
        self.payment_history_from_payment_intent()
        self.payment_history_from_refund()
        self.subscription_history()
        self.stdout.write(self.style.SUCCESS('Successfully populated billing history'))
