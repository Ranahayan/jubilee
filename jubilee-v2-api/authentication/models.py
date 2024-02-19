from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
from .managers import CustomUserManager
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from django.db.models import Q

class SignupOrigin(models.TextChoices):
    SHOPIFY = 'shopify', "Shopify"
    DIRECT = 'direct', "Direct Registration"


class PaymentProvider(models.TextChoices):
    STRIPE = 'stripe', "Stripe"
    SHOPIFY = 'shopify', "Shopify"


class CustomUser(AbstractUser):
    first_name = None
    last_name = None
    username = None
    email = models.EmailField(unique=True)
    reset_token = models.CharField(blank=True, max_length=255, null=True)
    payment_provider = models.CharField(blank=True, null=True, max_length=150, choices=PaymentProvider.choices)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = CustomUserManager()

    stripe_customer_id = models.CharField(max_length=64, null=True, blank=True)
    stripe_payment_method_id = models.CharField(max_length=64, null=True, blank=True)
    stripe_card_digits = models.CharField(max_length=4, blank=True, null=True)
    stripe_card_updated_at = models.DateTimeField(null=True, blank=True)
    has_created_stripe_upgrade_funnel_coupon = models.BooleanField(default=False)
    has_used_stripe_upgrade_funnel_coupon = models.BooleanField(default=False)
    categories = models.ManyToManyField('dropshipping.Category', related_name='+', blank=True)

    onboarding_choices = models.JSONField(default=dict)

    ps_xid = models.CharField(max_length=128, null=True, blank=True)

    utm_campaign = models.CharField(max_length=128, null=True, blank=True)
    utm_campaignid = models.CharField(max_length=128, null=True, blank=True)
    utm_source = models.CharField(max_length=128, null=True, blank=True)
    utm_medium = models.CharField(max_length=128, null=True, blank=True)
    utm_term = models.CharField(max_length=128, null=True, blank=True)
    utm_content = models.CharField(max_length=128, null=True, blank=True)
    utm_medium_variant = models.CharField(max_length=128, null=True, blank=True)
    utm_device = models.CharField(max_length=128, null=True, blank=True)
    utm_os = models.CharField(max_length=128, null=True, blank=True)
    utm_country = models.CharField(max_length=128, null=True, blank=True)
    utm_province = models.CharField(max_length=128, null=True, blank=True)
    utm_network = models.CharField(max_length=128, null=True, blank=True)
    utm_placement = models.CharField(max_length=128, null=True, blank=True)
    utm_loc_physical = models.CharField(max_length=128, null=True, blank=True)
    utm_adgroup = models.CharField(max_length=128, null=True, blank=True)
    utm_assetgroupid = models.CharField(max_length=128, null=True, blank=True)
    utm_creative = models.CharField(max_length=128, null=True, blank=True)
    utm_keyword = models.CharField(max_length=128, null=True, blank=True)
    utm_keywordid = models.CharField(max_length=128, null=True, blank=True)
    utm_searchterm = models.CharField(max_length=128, null=True, blank=True)
    utm_matchtype = models.CharField(max_length=128, null=True, blank=True)
    utm_location = models.CharField(max_length=128, null=True, blank=True)
    utm_sitelink = models.CharField(max_length=128, null=True, blank=True)
    
    name = models.CharField(blank=True, max_length=100)
    signup_origin = models.CharField(max_length=10, choices=SignupOrigin.choices, default=SignupOrigin.SHOPIFY)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the user's ID in the legacy system

    send_customer_io_emails = models.BooleanField(default=True, verbose_name="Send Customer.io emails", help_text="If unchecked, user will be removed from Customer.io and will not receive any emails from Customer.io")
    
    # Password expiry fields for admin users
    password_changed_at = models.DateTimeField(null=True, blank=True, help_text="Last time the password was changed.")
    previous_password_hash = models.CharField(max_length=128, blank=True, help_text="Hash of the previous password to prevent reuse.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email


class LoginActivity(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='login_activities'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} logged in at {self.timestamp}"
    
    class Meta:
        verbose_name_plural = "Login Activities"


class ShopQuerySet(models.QuerySet):
    def get_by_user(self, user: AbstractUser):
        try:
            return self.filter(owner_id=user.id).latest('last_updated_at')
        except Shop.DoesNotExist:
            return None

    def get_by_user_id(self, user_id):
        shop = self.filter(owner_id=user_id).latest('last_updated_at')
        if not shop:
            raise Shop.DoesNotExist
        return shop
    
    def get_by_name(self, shop_name):
        shop = Shop.objects.filter(url__regex=f'^{shop_name}\.').latest('last_updated_at')
        if not shop:
            raise Shop.DoesNotExist
        return shop

class Shop(models.Model):
    class ShopType(models.TextChoices):
        SHOPIFY = 'SP', "Shopify"

    type = models.CharField(max_length=2, choices=ShopType.choices, default=ShopType.SHOPIFY)
    url = models.TextField()
    shopify_access_token = models.CharField(max_length=64, null=True)
    temp_login_token = models.CharField(max_length=64, null=True, editable=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    last_updated_at = models.DateTimeField(auto_now=True)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the shop's ID in the legacy system
    is_active = models.BooleanField(default=True)
    objects = ShopQuerySet.as_manager()

    def __str__(self):
        return self.url


class UserShopConnection(models.Model):
    shop_url = models.TextField()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,
                              on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["shop_url", "owner"], name="unique_store_owner"
            )
        ]


class UserReview(models.Model):
    rating = models.IntegerField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    feedback = models.TextField(null=True)

class CustomerServicePermissionRestrictions(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'is_staff': True}
    )
    refund_daily_limit_cents = models.IntegerField(default=0, help_text="Daily refund limit in cents.")
    refund_daily_count_limit = models.IntegerField(default=0, help_text="Daily refund count limit.")
    plan_downgrade_limit_annual = models.IntegerField(default=0, help_text="Annual plan downgrade limit.")
    plan_downgrade_limit = models.IntegerField(default=0, help_text="Plan downgrade limit.")
    account_deletion_limit = models.IntegerField(default=0, help_text="Account deletion limit.")
    order_refund_daily_limit_cents = models.IntegerField(default=0, help_text="Daily order refund limit in cents.")
    plan_cancel_limit = models.IntegerField(default=0, help_text="Plan cancel count limit.")
    plan_pause_limit = models.IntegerField(default=0, help_text="Plan pause count limit.")
    can_extend_trial = models.BooleanField(
        default=False,
        help_text="Allow extending trials from admin.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "CS Permission Restriction"
        constraints = [
            models.UniqueConstraint(fields=["user"], name="unique_user")
        ]

    def clean(self):
        if not self.user.is_staff:
            raise ValidationError("Only staff users can be associated with permission restrictions.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} restrictions"


class CustomerServiceActionLog(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    affected_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="+",
        null=True,
        blank=True
    )
    user_email = models.EmailField(null=True, blank=True)
    action = models.CharField(max_length=100)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "CS Action Log"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author} {self.action} {self.affected_user}"
    
    @classmethod
    def get_logs(cls, author):
        queryset = cls.objects.filter(author=author)
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)

        return queryset.filter(
            created_at__gte=start_of_month, created_at__lte=now
        )
    
    @classmethod
    def format_money(cls, amount):
        amount = amount / 100 if amount > 0 else 0
        return "{:.2f}".format(amount)

    @classmethod
    def get_refund_data(cls, logs):
        logs = logs.filter(Q(action="refund") | Q(action="refund_order"))
        refund_count = logs.count()
        refund_amount = sum([log.metadata.get("amount", 0) for log in logs])
        return refund_count, cls.format_money(refund_amount)

    @classmethod
    def get_downgrade_data(cls, logs):
        logs = logs.filter(Q(action="downgrade") | Q(action="downgrade_annual"))
        downgrade_count = logs.count()
        downgrade_amount = sum([log.metadata.get("cost_difference", 0) for log in logs])
        return downgrade_count, cls.format_money(downgrade_amount)

    @classmethod
    def get_account_deletion_data(cls, logs):
        logs_count = logs.filter(Q(action="delete_user")).count()
        return logs_count

    @classmethod
    def get_extend_trial_data(cls, logs):
        logs_count = logs.filter(Q(action="extend_trial")).count()
        return logs_count
    
    @classmethod
    def get_summary(cls, user):
        logs = cls.get_logs(user)
        refund_count, refund_amount = cls.get_refund_data(logs)
        downgrade_count, downgrade_amount = cls.get_downgrade_data(logs)
        account_deletion_count = cls.get_account_deletion_data(logs)
        extend_trial_count = cls.get_extend_trial_data(logs)

        total_amount = float(refund_amount) + float(downgrade_amount)
        total_amount = "{:.2f}".format(total_amount)

        return {
            'name': user.name,
            'refund_count': refund_count,
            'refund_amount': refund_amount,
            'downgrade_count': downgrade_count,
            'downgrade_amount': downgrade_amount,
            'account_deletion_count': account_deletion_count,
            'extend_trial_count': extend_trial_count,
            'total_amount': total_amount,
        }


class Admin2FA(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_2fa',
        limit_choices_to={'is_staff': True}
    )
    totp_secret = models.CharField(max_length=32, blank=True, help_text="TOTP secret key (base32 encoded)")
    is_enabled = models.BooleanField(default=False, help_text="Whether 2FA is enabled for this user")
    is_setup_complete = models.BooleanField(default=False, help_text="Whether user has completed TOTP app setup (scanned QR code)")
    backup_codes = models.JSONField(default=list, help_text="Backup codes (one-time use)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_backup_code = models.CharField(max_length=10, null=True, blank=True, help_text="Last used backup code to prevent reuse")

    class Meta:
        verbose_name = "Admin 2FA"
        verbose_name_plural = "Admin 2FA Settings"

    def __str__(self):
        return f"2FA for {self.user.email} - {'Enabled' if self.is_enabled else 'Disabled'}"
    
    def save(self, *args, **kwargs):
        if self.is_enabled and not self.totp_secret:
            import pyotp
            self.totp_secret = pyotp.random_base32()
        super().save(*args, **kwargs)


class AdminPasskey(models.Model):
    """WebAuthn passkey credential for admin login. Each admin can register passkeys for themselves only."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_passkeys',
        limit_choices_to={'is_staff': True}
    )
    credential_id = models.CharField(max_length=256, unique=True, db_index=True)
    public_key = models.BinaryField()
    sign_count = models.PositiveIntegerField(default=0)
    transports = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Admin Passkey"
        verbose_name_plural = "Admin Passkeys"

    def __str__(self):
        return f"Passkey for {self.user.email} ({self.credential_id[:16]}...)"