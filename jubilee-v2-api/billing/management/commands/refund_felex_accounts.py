from authentication.models import CustomUser
import stripe
from django.core.management.base import BaseCommand
from django.conf import settings
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from datetime import datetime

slack_bot_token = settings.SLACK_BOT_TOKEN
slack_client = WebClient(token=slack_bot_token)

def send_markdown_message(text):
    if not slack_bot_token:
        return

    try:
        slack_client.chat_postMessage(
            channel='C06F3VDH144',
            text=text,
            mrkdwn=True
        )
    except SlackApiError as e:
        print("Error sending message: {}".format(e.response["error"]))

class Command(BaseCommand):
    help = "Issue refunds for Stripe accounts that contain 'felex' in their email."

    def handle(self, *args, **kwargs):
        accounts = CustomUser.objects.filter(email__icontains="@felex.co")
        
        if not accounts.exists():
            self.stdout.write(self.style.WARNING("No accounts found with 'felex' in the email."))
            return

        for account in accounts:
            try:
                customer_id = account.stripe_customer_id

                invoices = stripe.Invoice.list(customer=customer_id)
                
                for invoice in invoices:
                    if invoice.charge:
                        try:
                            charge = stripe.Charge.retrieve(invoice.charge)
                            if charge.refunded:
                                continue

                            refund = stripe.Refund.create(charge=invoice.charge)

                            period_start = datetime.fromtimestamp(invoice.period_start).strftime("%B %Y")

                            message = (
                                f"*Successfully refunded a charge for account {account.email}!*\n"
                                f"> Amount: ${refund.amount / 100}\n"
                                f"> Period: {period_start} \n"
                                f"> Subscription ID: {invoice.subscription if invoice.subscription else 'N/A'}"
                            )

                            send_markdown_message(message)
                            self.stdout.write(self.style.SUCCESS(
                                f"Successfully refunded charge {invoice.charge} for account {account.email} (refund ID: {refund.id})"
                            ))
                        except stripe.error.StripeError as e:
                            self.stdout.write(self.style.ERROR(
                                f"Failed to refund charge {invoice.charge} for account {account.email}: {e.user_message}"
                            ))
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(
                                f"Unexpected error for charge {invoice.charge} on account {account.email}: {str(e)}"
                            ))

            except stripe.error.StripeError as e:
                self.stdout.write(self.style.ERROR(
                    f"Failed to retrieve invoices for account {account.email}: {e.user_message}"
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Unexpected error occurred for account {account.email}: {str(e)}"
                ))

        self.stdout.write(self.style.SUCCESS("Refund process completed."))
