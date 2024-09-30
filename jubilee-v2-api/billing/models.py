from decimal import Decimal
from django.utils import timezone
from django.core.validators import MaxValueValidator
from django.db import models
from authentication.models import Shop, CustomUser

class PaymentProvider(models.TextChoices):
    STRIPE = 'stripe', "Stripe"
    SHOPIFY = 'shopify', "Shopify"
    PAYPAL = 'paypal', "PayPal"


class SubscriptionIntervals(models.TextChoices):
    MONTHLY = 'monthly', "Monthly"
    YEARLY = 'yearly', "Yearly"


class ActiveStatus(models.TextChoices):
    ACTIVE = 'AC', "Active"
    PAUSED = 'PA', "Paused"
    INACTIVE = 'IN', "Inactive"
    PAST_DUE = 'PD', "Past Due"

class PaymentType(models.TextChoices):
    REFUND = 'refund', "Refund"
    PAYMENT = 'payment', "Payment"

class EntityType(models.TextChoices):
    SUBSCRIPTION = 'subscription', "Subscription"
    ONE_TIME = 'one_time', "One Time"

class ReasonLeaving(models.TextChoices):
    BILLING = 'billing', "Billing"
    FEATURES = 'features', "Features"
    EXPENSIVE = 'expensive', "Expensive"
    NOT_SURE = 'not_sure', "Not sure"
    OTHER = 'other', "Other"

class PaymentStatus(models.TextChoices):
    PENDING = 'pending', "Pending"
    SUCCESS = 'succeeded', "Succeeded"
    FAILED = 'failed', "Failed"

class ActionStatus(models.TextChoices):
    CANCELLED = 'cancelled', "Cancelled"
    UPGRADED = 'upgraded', "Upgraded"
    DOWNGRADED = 'downgraded', "Downgraded"
    RESUMED = 'resumed', "Resumed"
    PAUSED = 'paused', "Paused"
    TRIALING = 'trialing', "Trialing"
    ACTIVATED = 'activated', "Activated"
    SCHEDULED_TO_CANCEL = 'scheduled_to_cancel', "Scheduled to Cancel"
    TRIAL_CANCELLED = 'trial_cancelled', "Trial Cancelled"
    INCOMPLETE = 'incomplete', "Incomplete"
    PAST_DUE = 'past_due', "Past Due"


class DiscountType(models.TextChoices):
    PERCENT = "percent", "Percent"
    FIXED_CENTS = "fixed_cents", "Fixed Amount"

class Duration(models.TextChoices):
    ONCE = "once", "Once"
    REPEATING = "repeating", "Repeating"
    FOREVER = "forever", "Forever"

class OneTimeBillingTransaction(models.Model):
    class TransactionStatus(models.TextChoices):
        ACTIVE = 'AC', "Active"
        DECLINED = 'DE', "Declined"
        EXPIRED = 'EX', "Expired"
        PENDING = 'PE', "Pending"

    status = models.CharField(max_length=2, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)
    cost_cents = models.IntegerField()
    billing_id = models.CharField(max_length=100, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SubscriptionPlan(models.Model):
    interval = models.CharField(max_length=10, choices=SubscriptionIntervals.choices,
                                default=SubscriptionIntervals.MONTHLY)
    status = models.CharField(max_length=2, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)
    cost_per_month = models.IntegerField()  # In cents
    old_cost_per_month = models.IntegerField(null=True)  # In cents
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    features = models.JSONField(default=list)
    limits = models.JSONField(default=dict)
    trial_days = models.IntegerField(default=0)
    name = models.CharField(max_length=100, null=True)
    is_highlighted = models.BooleanField(default=False)
    months_off = models.IntegerField(default=0)

    stripe_plan_id = models.CharField(max_length=100, null=True)
    stripe_upgrade_funnel_coupon_id = models.CharField(max_length=100, null=True)
    stripe_upgrade_funnel_coupon_code = models.CharField(max_length=100, null=True)

    paypal_plan_id = models.CharField(max_length=100, null=True)

    legacy_id = models.UUIDField(null=True, blank=True) # This is the plan's ID in the legacy system

    for_winning = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.interval} - ${self.cost_per_month / 100}/mo"


class SubscriptionQuerySet(models.QuerySet):
    def get_active_by_user(self, user: CustomUser):
        try:
            return self.filter(user=user, status=ActiveStatus.ACTIVE).order_by('-created_at').first()
        except Subscription.DoesNotExist:
            return None


class Subscription(models.Model):
    shop = models.ForeignKey('authentication.Shop', on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey('authentication.CustomUser', on_delete=models.SET_NULL, null=True)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    status = models.CharField(max_length=2, choices=ActiveStatus.choices, default=ActiveStatus.INACTIVE)
    external_id = models.CharField(max_length=100, null=True)
    payment_provider = models.CharField(max_length=10, choices=PaymentProvider.choices, default=PaymentProvider.SHOPIFY)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    cancel_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    trial_end_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the subscription's ID in the legacy system


    objects = SubscriptionQuerySet.as_manager()

    def __str__(self):
        return f"{self.user} - {self.plan}"


class AppSetting(models.Model):
    stripe_percentage = models.FloatField(validators=[MaxValueValidator(100)], max_length=10, blank=True)
    stripe_cancel_on_uninstall = models.BooleanField(default=False)
    paypal_webhook_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class PaymentHistory(models.Model):
    payment_type = models.CharField(max_length=15, choices=PaymentType.choices, default=PaymentType.PAYMENT)
    entity_type = models.CharField(max_length=15, choices=EntityType.choices, default=EntityType.SUBSCRIPTION)
    entity_external_id = models.CharField(max_length=150, null=True, blank=True)
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True)
    payment_external_id = models.CharField(max_length=150, null=True, blank=True)
    invoice_external_id = models.CharField(max_length=150, null=True, blank=True)
    invoice_pdf = models.URLField(null=True, blank=True)
    amount = models.IntegerField() # in cents
    shop = models.ForeignKey('authentication.Shop', on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey('authentication.CustomUser', on_delete=models.SET_NULL, null=True)
    payment_provider = models.CharField(max_length=10, choices=PaymentProvider.choices, default=PaymentProvider.STRIPE)
    status = models.CharField(max_length=15, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    created_at = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(max_length=4, blank=True, null=True)

class SubscriptionHistory(models.Model):
    action = models.CharField(max_length=25, choices=ActionStatus.choices, default=ActionStatus.ACTIVATED)
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, related_name='+')
    previous_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, related_name='+')
    shop = models.ForeignKey('authentication.Shop', on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey('authentication.CustomUser', on_delete=models.SET_NULL, null=True)
    payment_provider = models.CharField(max_length=10, choices=PaymentProvider.choices, default=PaymentProvider.STRIPE)
    start_date = models.DateTimeField(null=True)
    period_start = models.DateTimeField(null=True)
    period_end = models.DateTimeField(null=True)
    subscription_created_at = models.DateTimeField(null=True)
    trial_start = models.DateTimeField(null=True)
    trial_end = models.DateTimeField(null=True)
    cancelled_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(default=timezone.now)

class SubscriptionCancellation(models.Model):
    user = models.ForeignKey('authentication.CustomUser', on_delete=models.SET_NULL, null=True)
    reason = models.CharField(max_length=15, choices=ReasonLeaving.choices, default=ReasonLeaving.OTHER)
    returning = models.IntegerField(default=0)
    notes = models.CharField(null=True, blank=True)


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENT)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    duration = models.CharField(max_length=20, choices=Duration.choices, default=Duration.ONCE)
    duration_in_months = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True, null=True)
    plans = models.JSONField(default=dict, blank=True, null=True)
    active = models.BooleanField(default=True)
    use_promotional_code = models.BooleanField(default=False)
    max_redemptions = models.IntegerField(default=100, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def coupon_price_for(self, price_cents):
        """Calculate discounted price based on coupon type"""
        if self.discount_type == DiscountType.PERCENT:
            return int(price_cents * (1 - Decimal(self.percent_off()) / 100))
        return max(0, int(price_cents - self.amount_off()))

    def coupon_discount_for(self, price_cents):
        """Calculate percentage discount"""
        if self.discount_type == DiscountType.PERCENT:
            return self.percent_off()
        return int((self.amount_off() / float(price_cents)) * 100)

    def percent_off(self):
        return self.discount_value if self.discount_type == DiscountType.PERCENT else None

    def amount_off(self):
        return int(Decimal(self.discount_value) * 100) if self.discount_type == DiscountType.FIXED_CENTS else None

    def accepts_plan(self, plan):
        """Check if coupon applies to a given plan"""
        name = plan.name.lower()
        frequency = "annual" if plan.annual else "monthly"
        return self.plans.get(f"{name}_{frequency}", False)

    @classmethod
    def find_coupon(cls, code):
        """Find coupon by code, checking both promotional codes and direct coupons"""
        promotion_code = PromotionalCode.objects.filter(code=code).first()
        coupon = promotion_code.coupon if promotion_code else cls.objects.filter(code=code).first()
        return coupon, promotion_code

    def expired(self):
        """Check if the coupon is expired"""
        return self.expires_at and self.expires_at < now()

    def __str__(self):
        return f"{self.code}"

class CouponRedemption(models.Model):
    redeemable_id = models.UUIDField()
    redeemable_type = models.CharField(max_length=100)
    store = models.ForeignKey(
        "authentication.Shop",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="coupon_redemption_store",
    )
    subscription_id = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    subscription_type = models.CharField(
        max_length=10, choices=SubscriptionIntervals.choices, default=SubscriptionIntervals.MONTHLY
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.redeemable_type} - {self.redeemable_id}"

class PromotionalCode(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE)
    store = models.ForeignKey(
        "authentication.Shop",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="promotional_code_store",
    )
    code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.code


class TrialsKPIDay(models.Model):
    date = models.DateField(unique=True)
    stripe_trials_started = models.IntegerField(default=0)
    stripe_trials_converted = models.IntegerField(default=0)
    shopify_trials_started = models.IntegerField(default=0)
    shopify_trials_converted = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"Trials KPI {self.date}: stripe={self.stripe_trials_started}/{self.stripe_trials_converted}, " \
               f"shopify={self.shopify_trials_started}/{self.shopify_trials_converted}"
