from django.urls import path
from .webhooks import (
    redact_shop_data, 
    redact_customer_data, 
    get_customer_data, 
    app_uninstalled, 
    create_order,
    inventory_levels_update,
    inventory_items_update
)
from billing.webhooks import paypal_event_webhook, shopify_one_time_payment_update, shopify_subscription_update, stripe_event_webhook

urlpatterns = [
    path('shopify/customer_data/', get_customer_data, name="shopify_customer_data_webhook"),
    path('shopify/customer_redact/', redact_customer_data, name="shopify_customer_redact_webhook"),
    path('shopify/shop_redact/', redact_shop_data, name="shopify_shop_redact_webhook"),
    path('shopify/app_uninstalled/', app_uninstalled, name="shopify_app_uninstalled_webhook"),
    path('shopify/one_time_payment_update/', shopify_one_time_payment_update, name="shopify_one_time_payment_update"),
    path('shopify/subscription_update/', shopify_subscription_update, name="shopify_subscription_update"),
    path('shopify/create_order/', create_order, name='shopify_create_order_webhook'),
    path('shopify/inventory_levels_update/', inventory_levels_update, name='shopify_inventory_levels_update_webhook'),
    path('shopify/inventory_items_update/', inventory_items_update, name='shopify_inventory_items_update_webhook'),
    path('stripe/event/', stripe_event_webhook, name="stripe_event_webhook"),
    path('paypal/event/', paypal_event_webhook, name="paypal_event_webhook"),
]