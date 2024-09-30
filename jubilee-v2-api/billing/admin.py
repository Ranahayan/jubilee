from copy import deepcopy

from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.http import HttpRequest
from django.shortcuts import render, redirect
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.http import unquote
from django.utils import timezone

from core.admin import secure_admin_site, SecureModelAdmin
from authentication.models import (
    CustomerServiceActionLog,
    CustomerServicePermissionRestrictions,
)
from .models import (
    ActiveStatus,
    Subscription,
    SubscriptionPlan,
    PaymentHistory,
    SubscriptionHistory,
)
from .actions import (
    refund_payment,
    cancel_subscriptions,
    pause_subscriptions,
    resume_subscriptions
)


class PaymentHistoryAdmin(SecureModelAdmin):
    list_display = ['user', 'subscription', 'amount', 'status', 'payment_provider']
    list_filter = ['status', 'payment_provider']
    list_select_related = ['user', 'subscription', 'subscription__plan']
    fields = ['user', 'subscription', 'amount', 'status', 'payment_provider']
    raw_id_fields = ['user', 'subscription']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'subscription', 'subscription__plan'
        )


class ActiveSubscriptionPlanFilter(admin.SimpleListFilter):
    title = 'plan'
    parameter_name = 'plan'

    def lookups(self, request, model_admin):
        active_plans = SubscriptionPlan.objects.filter(status=ActiveStatus.ACTIVE)
        return [(plan.id, str(plan)) for plan in active_plans]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(plan__id=self.value())
        return queryset
    
class InlinePaymentHistory(admin.TabularInline):
    model = PaymentHistory
    extra = 0
    can_delete = False
    fields = ['payment_provider', 'amount', 'status', 'invoice_pdf', 'created_at']
    readonly_fields = [f.name for f in PaymentHistory._meta.fields]

class SubscriptionAdmin(SecureModelAdmin):
    list_display = ['user', 'plan', 'status', 'payment_provider', 'created_at', 'updated_at', 'cancel_at', 'cancelled_at', 'trial_end_at', 'paused_at']
    list_filter = [ActiveSubscriptionPlanFilter, 'status', 'payment_provider', 'cancel_at', 'cancelled_at', 'trial_end_at']
    search_fields = ['user__email']
    list_select_related = ['user', 'plan']
    readonly_fields = [
        'user',
        'status',
        'payment_provider',
        'created_at',
        'updated_at',
        'cancel_at',
        'cancelled_at',
        'trial_end_at',
        'paused_at',
        'next_billing_date',
        'extend_trial_button',
    ]
    fieldsets = (
        (
            None,
            {
                'fields': [
                    'user',
                    'plan',
                    'status',
                    'payment_provider',
                    'created_at',
                    'updated_at',
                    'cancel_at',
                    'cancelled_at',
                    'trial_end_at',
                    'next_billing_date',
                    'paused_at',
                    'extend_trial_button',
                ]
            }
        ),
    )
    exclude = ['shop', 'external_id']
    inlines = [InlinePaymentHistory]
    actions = [
        refund_payment,
        cancel_subscriptions,
        pause_subscriptions,
        resume_subscriptions
    ]

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'plan':
            kwargs["queryset"] = SubscriptionPlan.objects.filter(status=ActiveStatus.ACTIVE)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_fieldsets(self, request, obj=None):
        fieldsets = deepcopy(super().get_fieldsets(request, obj))
        if self._has_extend_trial_permission(request.user):
            return fieldsets

        for _, options in fieldsets:
            fields = options.get("fields")
            if not fields:
                continue
            options["fields"] = [
                field for field in fields if field != "extend_trial_button"
            ]
        return fieldsets

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<path:object_id>/extend-trial/",
                self.admin_site.admin_view(self.extend_trial_view),
                name="subscription_extend_trial",
            ),
        ]
        return custom_urls + urls

    def _has_extend_trial_permission(self, user):
        if not user:
            return False
        if not user.is_authenticated or not user.is_superuser:
            return False
        return CustomerServicePermissionRestrictions.objects.filter(
            user=user,
            can_extend_trial=True,
        ).exists()

    def _compute_next_billing_date(self, subscription):
        if subscription.trial_end_at and subscription.trial_end_at > timezone.now():
            return subscription.trial_end_at
        return (
            SubscriptionHistory.objects.filter(subscription=subscription)
            .order_by("-created_at")
            .values_list("period_end", flat=True)
            .first()
        )

    def _has_already_extended_trial(self, subscription):
        if subscription.external_id:
            return CustomerServiceActionLog.objects.filter(
                action="extend_trial",
                metadata__external_id=subscription.external_id,
            ).exists()

        return CustomerServiceActionLog.objects.filter(
            action="extend_trial",
            affected_user_id=subscription.user_id,
        ).exists()

    def next_billing_date(self, obj):
        if not obj:
            return "-"
        next_billing_date = self._compute_next_billing_date(obj)
        return next_billing_date or "Not available"

    def extend_trial_button(self, obj):
        if not obj:
            return "-"
        url = reverse("admin:subscription_extend_trial", args=[obj.pk])
        return format_html('<a class="button" href="{}">Extend trial</a>', url)

    def extend_trial_view(self, request, object_id, *args, **kwargs):
        if not self._has_extend_trial_permission(request.user):
            raise PermissionDenied

        subscription = self.get_object(request, unquote(object_id))
        if not subscription:
            self.message_user(request, "Subscription not found.", level=messages.ERROR)
            return redirect("/admin/")

        now = timezone.now()
        has_active_trial = bool(
            subscription.trial_end_at and subscription.trial_end_at > now
        )
        already_extended = self._has_already_extended_trial(subscription)
        trial_extension_days = [7, 14, 30]
        next_billing_date = self._compute_next_billing_date(subscription)

        if request.method == "POST":
            if not self._has_extend_trial_permission(request.user):
                raise PermissionDenied

            already_extended = self._has_already_extended_trial(subscription)
            has_active_trial = bool(
                subscription.trial_end_at and subscription.trial_end_at > timezone.now()
            )
            if already_extended:
                self.message_user(
                    request,
                    "Trial has already been extended once for this subscription.",
                    level=messages.ERROR,
                )
                return redirect(
                    reverse("admin:billing_subscription_change", args=[subscription.pk])
                )
            if not has_active_trial:
                self.message_user(
                    request,
                    "This subscription does not have an active trial.",
                    level=messages.ERROR,
                )
                return redirect(
                    reverse("admin:billing_subscription_change", args=[subscription.pk])
                )

            try:
                days = int(request.POST.get("days", ""))
            except (TypeError, ValueError):
                days = None
            if days not in trial_extension_days:
                self.message_user(
                    request,
                    "Invalid trial extension length. Allowed values are 7, 14, or 30.",
                    level=messages.ERROR,
                )
                return redirect(request.path)

            subscription.trial_end_at = subscription.trial_end_at + timezone.timedelta(
                days=days
            )
            subscription.save(update_fields=["trial_end_at", "updated_at"])
            self.message_user(
                request,
                f"Trial extended by {days} days for {subscription.user.email}.",
                level=messages.SUCCESS,
            )
            return redirect(
                reverse("admin:billing_subscription_change", args=[subscription.pk])
            )

        context = {
            **self.admin_site.each_context(request),
            "subscription": subscription,
            "next_billing_date": next_billing_date,
            "already_extended": already_extended,
            "has_active_trial": has_active_trial,
            "trial_extension_days": trial_extension_days,
        }
        return render(request, "admin/subscription_extend_trial.html", context)

# Register all models with secure_admin_site
secure_admin_site.register(PaymentHistory, PaymentHistoryAdmin)
secure_admin_site.register(Subscription, SubscriptionAdmin)
