from django import forms
from django.contrib.admin.widgets import AdminSplitDateTime
from .models import Coupon, PromotionalCode, PaymentProvider
from authentication.models import Shop

PLAN_KEYS = [
    "starter_monthly",
    "professional_monthly",
    "empire_monthly",
    "unicorn_monthly",
    "starter_winning_monthly",
    "professional_winning_monthly",
    "empire_winning_monthly",
    "unicorn_winning_monthly",
    "professional_annual",
    "empire_annual",
    "unicorn_annual",
]

class CouponAdminForm(forms.ModelForm):
    starter_monthly = forms.BooleanField(required=False, label="Starter monthly")
    professional_monthly = forms.BooleanField(required=False, label="Professional monthly")
    empire_monthly = forms.BooleanField(required=False, label="Empire monthly")
    unicorn_monthly = forms.BooleanField(required=False, label="Unicorn monthly")
    starter_winning_monthly = forms.BooleanField(required=False, label="Starter monthly with winning Products")
    professional_winning_monthly = forms.BooleanField(required=False, label="Professional monthly with winning Products")
    empire_winning_monthly = forms.BooleanField(required=False, label="Empire monthly with winning Products")
    unicorn_winning_monthly = forms.BooleanField(required=False, label="Unicorn monthly with winning Products")
    professional_annual = forms.BooleanField(required=False, label="Professional annual")
    empire_annual = forms.BooleanField(required=False, label="Empire annual")
    unicorn_annual = forms.BooleanField(required=False, label="Unicorn annual")
    cs_usage = forms.BooleanField(required=False, label="CS usage")
    success_message = forms.CharField(required=False, label="Success message")

    class Meta:
        model = Coupon
        fields = [
            "code",
            "name",
            "active",
            "discount_type",
            "discount_value",
            "duration",
            "duration_in_months",
            "max_redemptions",
            "expires_at",
            "use_promotional_code",
            # The actual `metadata` and `plans` JSON fields are excluded
            # because we’re exposing them as separate form fields:
            "metadata",
            "plans",
        ]
        widgets = {
            "expires_at": AdminSplitDateTime(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for plan_key in PLAN_KEYS:
            if self.instance.plans:
                is_checked = self.instance.plans.get(plan_key, False)
                self.fields[plan_key].initial = bool(is_checked in ["1", True])
            else:
                self.fields[plan_key].initial = False

        if self.instance.metadata:
            self.fields["cs_usage"].initial = (
                str(self.instance.metadata.get("cs_usage", "")).lower() == "true"
            )
            self.fields["success_message"].initial = self.instance.metadata.get("success_message", "")
        else:
            self.fields["cs_usage"].initial = False
            self.fields["success_message"].initial = ""

    def clean(self):
        cleaned_data = super().clean()

        updated_plans = {}
        for plan_key in PLAN_KEYS:
            updated_plans[plan_key] = "1" if cleaned_data.get(plan_key) else "0"
        self.instance.plans = updated_plans

        if not self.instance.metadata:
            self.instance.metadata = {}

        self.instance.metadata["cs_usage"] = "true" if cleaned_data.get("cs_usage") else "false"
        self.instance.metadata["success_message"] = cleaned_data.get("success_message", "")

        return cleaned_data

    def clean_discount_value(self):
        val = self.cleaned_data["discount_value"]
        if val is not None and val <= 0:
            raise forms.ValidationError("Discount value must be greater than zero.")
        return val

class PromotionalCodeInlineForm(forms.ModelForm):
    class Meta:
        model = PromotionalCode
        fields = ["code", "store"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 1) Let store be optional
        self.fields["store"].required = False
        # 2) Restrict choices to shops whose owner has payment_provider=STRIPE
        self.fields["store"].queryset = Shop.objects.filter(
            owner__payment_provider=PaymentProvider.STRIPE
        )