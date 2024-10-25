from rest_framework import serializers
import stripe
from .models import SubscriptionCancellation, SubscriptionPlan, Subscription, PaymentHistory, SubscriptionHistory
from authentication.models import CustomUser
from .constants import TRIAL_INITIAL_COST_CENTS


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    stripe_upgrade_funnel_coupon = serializers.SerializerMethodField()
    store_creation_tax_cents = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        exclude = ['stripe_upgrade_funnel_coupon_id']

    def get_stripe_upgrade_funnel_coupon(self, obj):
        if not obj.stripe_upgrade_funnel_coupon_id:
            return None

        coupon = stripe.Coupon.retrieve(obj.stripe_upgrade_funnel_coupon_id)

        duration_in_months = coupon.duration_in_months
        if coupon.duration == 'forever':
            duration_in_months = None
        if coupon.duration == 'once':
            duration_in_months = 1

        return {"duration_in_months": duration_in_months, "percent_off": coupon.percent_off}
    
    def get_store_creation_tax_cents(self, obj):
        if obj.interval == 'yearly':
            return 0

        user = self.context.get('user', None)
        if not user or not isinstance(user, CustomUser):
            return 100

        if user.payment_provider == 'stripe':
            return 100

        return 0


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'status', 'created_at', 'updated_at', 'paused_at', 'payment_provider', 'cancel_at', 'cancelled_at', 'trial_end_at']


class PaymentHistorySerializer(serializers.ModelSerializer):
    subscription_history = serializers.SerializerMethodField()

    class Meta:
        model = PaymentHistory
        fields = ['id', 'invoice_pdf', 'payment_external_id', 'payment_method', 'amount', 'status', 'subscription_history', 'created_at', 'entity_type']
    
    def get_subscription_history(self, obj):
        subscription_history = SubscriptionHistory.objects.filter(subscription=obj.subscription).order_by('-created_at').first()
        if not subscription_history:
            return None

        return { 'period_start': subscription_history.period_start, 'period_end': subscription_history.period_end }

class SubscriptionCancellationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionCancellation
        fields = ['reason', 'returning', 'notes']
