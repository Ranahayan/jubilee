import time
from django.contrib import admin, messages
from django.http import HttpRequest
from django.urls import path, reverse
from django.shortcuts import redirect
from django.utils.http import unquote
from django.conf import settings
from django.utils.html import format_html, escapejs
from django.utils.formats import localize
from django.utils import timezone

from core.admin import secure_admin_site, SecureModelAdmin
from billing.actions import delete_user
from .models import (
    LoginActivity,
    Shop,
    CustomUser,
    UserShopConnection,
    Admin2FA
)
from billing.models import (
    ActiveStatus,
    Subscription,
    SubscriptionPlan
)
from rest_framework.authtoken.models import TokenProxy

class ShopInline(admin.TabularInline):
    model = Shop
    extra = 0


class ShopConnectionInline(admin.TabularInline):
    model = UserShopConnection
    extra = 0
    readonly_fields = ['created_at']


class SubscriptionInline(admin.StackedInline):
    model = Subscription
    extra = 0
    exclude = ['shop']
    readonly_fields = ['user', 'status', 'payment_provider', 'external_id', 'created_at', 'updated_at', 'cancel_at', 'cancelled_at', 'paused_at', 'next_billing_date']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'plan':
            kwargs["queryset"] = SubscriptionPlan.objects.filter(status=ActiveStatus.ACTIVE)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def next_billing_date(self, obj):
        if obj.cancel_at:
            return localize(obj.cancel_at)
        if obj.plan.interval == "monthly":
            next_billing = obj.created_at + timezone.timedelta(days=30)
            return localize(next_billing)
        elif obj.plan.interval == "yearly":
            next_billing = obj.created_at + timezone.timedelta(days=365)
            return localize(next_billing)
        return "N/A"

class LoginActivityInline(admin.TabularInline):
    model = LoginActivity
    extra = 0
    readonly_fields = ['timestamp']
    ordering = ['-timestamp'] 
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

class CustomUserAdmin(SecureModelAdmin):
    list_display = ['email', 'name', 'is_active',
                    'signup_origin', 'created_at', 'updated_at']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'signup_origin', 'created_at']
    search_fields = ['email', 'usershopconnection__shop_url']
    inlines = [ShopInline, ShopConnectionInline, SubscriptionInline, LoginActivityInline]
    list_per_page = settings.LIST_PER_PAGE
    actions = [delete_user]
    readonly_fields = [
        'email', 'password', 'last_login', 'created_at', 'updated_at',
        'stripe_customer_id', 'stripe_card_digits', 'payment_provider',
        'password_changed_at', 'temp_password_link',
    ]
    fieldsets = (
        ('Account Information', {
            'fields': ('email', 'name', 'is_active', 'signup_origin', 'created_at', 'updated_at'),
        }),
        ('Password Information', {
            'fields': ('password', 'last_login', 'password_changed_at', 'temp_password_link'),
        }),
        ('Payment Information', {
            'fields': ('payment_provider', 'stripe_customer_id', 'stripe_card_digits', 'send_customer_io_emails'),
        }),
    )
    exclude = [
        'reset_token', 'stripe_payment_method_id', 'stripe_card_updated_at',
        'categories', 'has_created_stripe_upgrade_funnel_coupon',
        'has_used_stripe_upgrade_funnel_coupon', 'onboarding_choices', 'ps_xid',
        'previous_password_hash', 'date_joined', 'groups', 'user_permissions',
        'is_staff', 'is_superuser', 'legacy_id',
        'utm_campaign', 'utm_campaignid', 'utm_source', 'utm_medium', 'utm_term',
        'utm_content', 'utm_medium_variant', 'utm_device', 'utm_network',
        'utm_placement', 'utm_loc_physical', 'utm_adgroup', 'utm_assetgroupid',
        'utm_creative', 'utm_keyword', 'utm_keywordid', 'utm_searchterm',
        'utm_matchtype', 'utm_location', 'utm_sitelink',
    ]


    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<path:object_id>/temp-password/",
                self.admin_site.admin_view(self.temp_password_view),
                name="customuser_temp_password",
            )
        ]
        return custom_urls + urls

    def temp_password_view(self, request, object_id, *args, **kwargs):
        user = self.get_object(request, unquote(object_id))

        if not user:
            self.message_user(request, "User not found.", level=messages.ERROR)
            return redirect("/admin/")

        # sets temp password
        old_password = user.password
        temp_password = "123123123"
        user.set_password(temp_password)
        user.save()

        # reverts after 10s
        time.sleep(10)
        user.password = old_password
        user.save()

        self.message_user(
            request,
            f"Password reverted for {user.email}.",
            level=messages.SUCCESS
        )

        return redirect(request.META.get("HTTP_REFERER", "/admin/"))

    def temp_password_link(self, obj):
        url = reverse("admin:customuser_temp_password", args=[obj.pk])

        temp_password = "123123123"
        email = obj.email

        message = (
            f"Set temporary password to '{temp_password}' for {email}. "
            f"It will revert in 10 seconds.\n\nContinue?"
        )

        return format_html(
            '<a class="button" href="{}" onclick="return confirm(\'{}\')">Temporary password</a>',
            url,
            escapejs(message)
        )

    temp_password_link.short_description = "Temporary password"


class ShopAdmin(SecureModelAdmin):
    list_display = ['url', 'type', 'owner_email', 'last_updated_at']
    list_filter = []
    readonly_fields = ['owner', 'last_updated_at']
    fields = ['url', 'type', 'owner', 'last_updated_at']
    search_fields = ['owner__email']
    list_select_related = ('owner',)

    def owner_email(self, obj):
        return obj.owner.email if obj.owner else None

    owner_email.short_description = 'Owner Email'

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False


class Admin2FAAdmin(SecureModelAdmin):
    list_display = ['user', 'is_enabled', 'is_setup_complete', 'created_at', 'updated_at']
    list_filter = ['is_enabled', 'is_setup_complete', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['totp_secret', 'backup_codes', 'created_at', 'updated_at', 'last_used_backup_code']
    
    def has_view_permission(self, request, obj=None):
        if not request.user.is_superuser:
            return False
        if request.user.groups.filter(name="Customer Service Group").exists():
            return False
        return True
    
    def has_change_permission(self, request, obj=None):
        if not request.user.is_superuser:
            return False
        if request.user.groups.filter(name="Customer Service Group").exists():
            return False
        return True
    
    def has_delete_permission(self, request, obj=None):
        if not request.user.is_superuser:
            return False
        if request.user.groups.filter(name="Customer Service Group").exists():
            return False
        return True
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            return qs.none()
        if request.user.groups.filter(name="Customer Service Group").exists():
            return qs.none()
        return qs


# Register all models with secure_admin_site
secure_admin_site.register(CustomUser, CustomUserAdmin)
secure_admin_site.register(Shop, ShopAdmin)
# secure_admin_site.register(Admin2FA, Admin2FAAdmin)

admin.site.unregister(TokenProxy)
