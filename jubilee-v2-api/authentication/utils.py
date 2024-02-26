import re
from authentication.models import CustomUser
from billing.models import AppSetting, PaymentProvider, SubscriptionIntervals
from django.conf import settings
from django.db import connection
from django.utils import timezone
from authentication.partnerstack import send_conversion_request


# Function to manage the payment provider for the given shop owner based on the Stripe user percentage threshold.
def manage_stripe_user_payment_provider(s_shop_owner_email):
    s_shop_owner = CustomUser.objects.get(email__iexact=s_shop_owner_email)
    latest_users = CustomUser.objects.order_by('-date_joined')[:100]
    total_count = latest_users.count()
    stripe_users = [user for user in latest_users if user.payment_provider == PaymentProvider.STRIPE]
    stripe_count = len(stripe_users) if stripe_users is not None else 0
    stripe_percentage = (stripe_count / total_count) * 100
    app_settings = AppSetting.objects.last()
    if '@shopify.' in s_shop_owner_email:
        s_shop_owner.payment_provider = PaymentProvider.SHOPIFY
    elif app_settings.stripe_percentage > stripe_percentage:
        s_shop_owner.payment_provider = PaymentProvider.STRIPE
    else:
        s_shop_owner.payment_provider = PaymentProvider.SHOPIFY

    s_shop_owner.save()


def customer_io_id(user_id):
    return settings.APP_NAME + "_" + str(user_id)


def send_analytics_data(user_id, event_type=None, event_data=None):
    if not settings.CUSTOMER_IO:
        return

    cursor = connection.cursor()

    query = """
        SELECT 
            u.ps_xid, u.name, u.email, u.send_customer_io_emails, sp.name, sp.interval, sub2.external_id, sub2.trial_end_at, sub2.cancel_at, sub2.status, sub2.created_at, u.signup_origin,
            s2.id, u.created_at, sub2.paused_at, sh2.action, sh2.created_at
        FROM authentication_customuser u
        LEFT JOIN 
            (
                SELECT 
                    owner_id, MAX(last_updated_at) AS max_last_updated_at
                FROM 
                    authentication_shop
                GROUP BY 
                    owner_id
            ) s ON u.id = s.owner_id
        LEFT JOIN authentication_shop s2 ON s.owner_id = s2.owner_id AND s.max_last_updated_at = s2.last_updated_at
        LEFT JOIN 
            (
                SELECT 
                    user_id, MAX(created_at) AS max_created_at
                FROM 
                    billing_subscription
                GROUP BY 
                    user_id
            ) sub ON u.id = sub.user_id
        LEFT JOIN billing_subscription sub2 ON sub.user_id = sub2.user_id AND sub.max_created_at = sub2.created_at
        LEFT JOIN billing_subscriptionplan sp ON sub2.plan_id = sp.id
        LEFT JOIN 
            (
                SELECT 
                    subscription_id, MAX(created_at) AS max_created_at
                FROM 
                    billing_subscriptionhistory
                WHERE
                    action IN ('upgraded', 'downgraded')
                GROUP BY 
                    subscription_id
            ) sh ON sub2.id = sh.subscription_id
        LEFT JOIN billing_subscriptionhistory sh2 ON sh.subscription_id = sh2.subscription_id AND sh.max_created_at = sh2.created_at
        WHERE 
            u.id = %s
    """

    cursor.execute(query, [user_id])
    rows = cursor.fetchall()
    row = rows[0]

    (ps_xid, name, email, send_customer_io_emails, plan_name, plan_interval, sub_external_id, trial_end_at, cancel_at, sub_status, sub_created_at, signup_origin, shop_id,
     user_created_at, paused_plan_at, sub_action, sub_action_created_at) = row

    if not send_customer_io_emails:
        return

    plan_paused_until = paused_plan_at + timezone.timedelta(days=30) if paused_plan_at is not None else None

    customer_data = {
        'id': customer_io_id(user_id),
        'name': name,
        'email': email,
        'active_plan': plan_name,
        'plan_annual': plan_interval == SubscriptionIntervals.YEARLY,
        'is_upgraded': sub_created_at is not None,
        'trial_end_at': trial_end_at,
        'cancel_at': cancel_at,
        'sub_started_at': sub_created_at,
        'signup_origin': signup_origin,
        'has_store_connected': shop_id is not None,
        'created_at': user_created_at,
        'downgraded_at': sub_action_created_at if sub_action == 'downgraded' else None,
        'upgraded_at': sub_action_created_at if sub_action == 'upgraded' else None,
        'sub_status': "active" if sub_status == 'AC' else "inactive",
        'plan_paused_until': plan_paused_until,
        'last_synced': timezone.now(),
        'app_name': settings.APP_NAME,
    }

    settings.CUSTOMER_IO.identify(**customer_data)

    send_conversion_request(ps_xid, user_id, email, name, [sub_external_id])

    if event_type and event_data:
        settings.CUSTOMER_IO.track(customer_id=user_id, name=event_type, data=event_data)


def extract_referrer_source(request):
    utm_source = None
    if hasattr(request, 'data'):
        utm_source = request.data.get('utm_source')
    elif hasattr(request, 'POST') and hasattr(request, 'GET'):
        utm_source = request.POST.get('utm_source') or request.GET.get('utm_source')

    if utm_source:
        return utm_source

    referrer = request.META.get('HTTP_REFERER', '')
    match = re.search(r"^(?:https?:\/\/)?(?:www\.)?([^\/\?]+)", referrer)

    if not match:
        return ""

    domain_parts = match.group(1).split('.')

    if len(domain_parts) >= 3 and domain_parts[-2] in {"co", "com", "org", "net"}:
        return domain_parts[-3]  # Ex: www.domain.co.uk → domain
    if len(domain_parts) >= 2:
        return domain_parts[-2]  # Ex: shop.shopify.com → shopify

    return ""