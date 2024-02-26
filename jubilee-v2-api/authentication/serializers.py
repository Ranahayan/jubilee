from rest_framework import serializers
from dj_rest_auth.serializers import (
    PasswordChangeSerializer as DefaultPasswordChangeSerializer,
)

from .models import CustomUser, Shop
from billing.models import (
    AppSetting,
    Subscription,
    ActiveStatus,
    ActionStatus,
    SubscriptionHistory,
)
from billing.serializers import SubscriptionSerializer
from dropshipping.serializers import CategorySerializer


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ["type", "url", "last_updated_at"]


class CustomUserSerializer(serializers.ModelSerializer):
    has_password = serializers.SerializerMethodField()
    active_subscription = serializers.SerializerMethodField()
    has_subscribed_before = serializers.SerializerMethodField()
    last_subscription = serializers.SerializerMethodField()
    is_annual_shopify = serializers.SerializerMethodField()
    pause_count = serializers.SerializerMethodField()
    categories = CategorySerializer(many=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "name",
            "email",
            "signup_origin",
            "stripe_card_digits",
            "onboarding_choices",
            "created_at",
            "last_subscription",
            "has_password",
            "payment_provider",
            "active_subscription",
            "has_subscribed_before",
            "is_annual_shopify",
            "pause_count",
            "has_created_stripe_upgrade_funnel_coupon",
            "has_used_stripe_upgrade_funnel_coupon",
            "stripe_card_updated_at",
            "categories"
        ]

    def get_has_password(self, obj):
        if obj.password:
            return True
        return False

    def get_active_subscription(self, obj):
        subscription = (
            Subscription.objects.filter(
                user=obj, status__in=[ActiveStatus.ACTIVE, ActiveStatus.PAUSED]
            )
            .order_by("-created_at")
            .first()
        )
        if subscription:
            return SubscriptionSerializer(subscription).data
        return None

    def get_pause_count(self, obj):
        pause_count = SubscriptionHistory.objects.filter(
            user=obj, action=ActionStatus.PAUSED
        ).count()
        if not pause_count:
            return 0
        return pause_count

    def get_has_subscribed_before(self, obj):
        had_subscriptions = (
            SubscriptionHistory.objects.filter(user=obj)
            .exclude(action=ActionStatus.INCOMPLETE)
            .exists()
        )
        if had_subscriptions:
            return True
        return False

    def get_last_subscription(self, obj):
        subscription = (
            Subscription.objects.filter(user=obj).order_by("-created_at").first()
        )
        if subscription:
            return SubscriptionSerializer(subscription).data
        return None

    def get_is_annual_shopify(self, obj):
        app_settings = AppSetting.objects.last()
        return app_settings.stripe_percentage == 0


class ResetUserPasswordSerializer(serializers.ModelSerializer):
    token = serializers.CharField()
    password = serializers.CharField()
    repeat_password = serializers.CharField()

    class Meta:
        model = CustomUser
        fields = ["token", "password", "repeat_password"]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if attrs["repeat_password"] != attrs["password"]:
            raise serializers.ValidationError("Repeat password doesn't match")

        return attrs


class PasswordChangeSerializer(DefaultPasswordChangeSerializer):
    email = serializers.EmailField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    old_password = serializers.CharField(required=False)

    def validate_old_password(self, value):
        """
        Validate the old_password.
        """
        user = self.context["request"].user

        if user.has_usable_password() and not user.check_password(value):
            raise serializers.ValidationError(
                "Your old password was entered incorrectly. Please enter it again."
            )
        return value

    def save(self):
        name = self.validated_data.get("name")
        email = self.validated_data.get("email")
        user = self.context["request"].user

        if email:
            email = CustomUser.objects.normalize_email(email)

            email_is_taken = (
                CustomUser.objects.filter(email=email).exclude(id=user.id).exists()
            )

            if email_is_taken:
                raise serializers.ValidationError("Email is already taken")

        super().save()

        if name:
            user.name = name
        if email:
            user.email = email
        if name or email:
            user.save()


class EditUserSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    onboarding_choices = serializers.JSONField(required=False)


class RegisterUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)


class LoginUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ConnectShopSerializer(serializers.Serializer):
    shop_url = serializers.CharField()
