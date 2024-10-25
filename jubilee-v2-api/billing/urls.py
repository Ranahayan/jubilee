from django.urls import path
from .views import CSBillingActionsLog, CreateSubscriptionCancellation, GetStripeProration, GetSubscriptionPlans, PaypalConfirmSubscription, PaypalSubscribe, ShopifySubscribe, StripePromoCode, StripeSubscribe, CancelSubscription, UpdateStripeDetails, PauseSubscription, ResumeSubscription, GetPaymentHistory, StripeSetupIntent

urlpatterns = [
    path('subscriptions/plans/', GetSubscriptionPlans.as_view(), name="billing_get_subscription_plans"),
    path('subscriptions/invoices/', GetPaymentHistory.as_view(), name="billing_get_subscription_invoices"),
    path('subscriptions/cancel/', CancelSubscription.as_view(), name="billing_cancel_subscription"),
    path('subscriptions/pause/', PauseSubscription.as_view(), name="billing_pause_subscription"),
    path('subscriptions/resume/', ResumeSubscription.as_view(), name="billing_resume_subscription"),
    path('subscriptions/shopify/subscribe/', ShopifySubscribe.as_view(), name="billing_shopify_subscribe"),
    path('subscriptions/paypal/subscribe/', PaypalSubscribe.as_view(), name="billing_paypal_subscribe"),
    path('subscriptions/paypal/confirm/<str:subscription_id>/', PaypalConfirmSubscription.as_view(), name="billing_paypal_confirm"),
    path('subscriptions/stripe/subscribe/', StripeSubscribe.as_view(), name="billing_stripe_subscribe"),
    path('subscriptions/stripe/intent/', StripeSetupIntent.as_view(), name="billing_stripe_setup_intent"),
    path('subscriptions/stripe/update/', UpdateStripeDetails.as_view(), name="billing_stripe_update"),
    path('subscriptions/stripe/proration/<int:plan_id>/', GetStripeProration.as_view(), name="billing_get_stripe_proration"),
    path('subscriptions/stripe/promo-code/<str:promo_code>/', StripePromoCode.as_view(), name="billing_stripe_promo_code"),
    path('subscriptions/cancellation/', CreateSubscriptionCancellation.as_view(), name='create-subscription-cancellation'),
    path('customer-service-report/', CSBillingActionsLog.as_view(), name='generate-cs-report'),
]
