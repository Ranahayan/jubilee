from django.conf import settings
from django.core.mail import send_mass_mail


def send_mass_deactivated_product_email(titles_by_shop):
    email_messages = [(
        "Warning: Deactivated items in Shopify",
        f"Hey there! We're writing to let you know that the following product variants that you had in your store are now inactive, so we have set their inventory quantity to 0 in your shopify store:\n\n\t" +
        "\n\t".join(titles),
        settings.DEFAULT_FROM_EMAIL,
        [shop.owner.email]
    ) for shop, titles in titles_by_shop.items() if len(titles) > 0]

    send_mass_mail(email_messages, fail_silently=True)
