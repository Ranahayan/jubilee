from django.core.mail import EmailMessage
from django.conf import settings


def send_reset_password_email(to_email, redirection_uri):
    email = EmailMessage(
        subject='Hey there! Want to reset your password?',
        to=[to_email],
    )
    email.template_id = settings.RESET_EMAIL_TEMPLATE_ID
    email.dynamic_template_data = {
        "email_to": to_email,
        "redirection_url": redirection_uri
    }

    email.send(fail_silently=True)
