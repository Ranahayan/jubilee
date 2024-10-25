import stripe
from billing.permissions import AllowOnlyServerPeerToPeer
from billing.webhooks import activate_paypal_subscription
from dropshipping.errors import ResponseError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SubscriptionHistory, SubscriptionPlan, Subscription, ActiveStatus, PaymentHistory, PaymentStatus, ActionStatus, PaymentProvider
from .serializers import SubscriptionCancellationSerializer, SubscriptionPlanSerializer, PaymentHistorySerializer
from .stripe import get_or_create_customer, get_proration_value, create_stripe_setup_intent, get_payment_method_from_setup_intent
from billing import paypal
from authentication.models import CustomerServiceActionLog, CustomerServicePermissionRestrictions, Shop
from .subscriptions import cancel_subscription, create_paypal_subscription, create_stripe_subscription, create_shopify_subscription, pause_subscription, resume_subscription
from django.utils import timezone
from authentication.utils import send_analytics_data
from django.db.models import Count, Q
from django.conf import settings
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q


class GetSubscriptionPlans(APIView):
    def get(self, request, format=None):
        user = request.user
        plans = SubscriptionPlan.objects.order_by('cost_per_month')
        if not plans:
            return Response({'message': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        # Use serializer to return all plans
        serializer = SubscriptionPlanSerializer(plans, context={'user': user}, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetPaymentHistory(APIView):
    def get(self, request, format=None):
        user = request.user

        payment_history = PaymentHistory.objects.filter(user=user, subscription__isnull=False)

        if not payment_history:
            return Response({'message': 'Invoices not found'}, status=status.HTTP_404_NOT_FOUND)

        payment_intents = {}
        for payment in payment_history:
            old_payment = payment_intents.get(payment.payment_external_id)

            if old_payment is None or (old_payment.created_at < payment.created_at and not old_payment.status == PaymentStatus.SUCCESS) or payment.status == PaymentStatus.SUCCESS:
                payment_intents[payment.payment_external_id] = payment
        
        payment_history = list(payment_intents.values())
        payment_history.sort(key=lambda x: x.created_at, reverse=True)
       
        serializer = PaymentHistorySerializer(payment_history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ShopifySubscribe(APIView):
    def post(self, request, format=None):
        # Get current user & shop from auth token
        user = request.user
        shop = Shop.objects.get_by_user(user)
        if not shop:
            return Response({'message': 'Please connect a store and try again...'}, status=status.HTTP_404_NOT_FOUND)

        # Get subscription plan from request
        plan_id = request.data.get('plan_id')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'message': 'Subscription does not exists'}, status=status.HTTP_404_NOT_FOUND)

        confirmation_url, errors = create_shopify_subscription(shop, plan)
        if errors:
            return Response({'payment_method_id': errors}, status=status.HTTP_400_BAD_REQUEST)

        send_analytics_data(user.id, 'shopify_subscription_attempt', {'plan_name': plan.name, 'plan_interval': plan.interval, 'email': user.email})

        return Response({"confirmation_url": confirmation_url}, status=status.HTTP_200_OK)


class PaypalSubscribe(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        user = request.user

        if not paypal.is_paypal_configured():
            return Response({"error": "Paypal subscriptions are not configured"}, status=status.HTTP_400_BAD_REQUEST)

        if not plan_id:
            return Response({"error": "Plan id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

        if not plan.paypal_plan_id:
            return Response({"error": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

        payment_url = create_paypal_subscription(user, plan)

        send_analytics_data(user.id, 'paypal_subscription_attempt', {'plan_name': plan.name, 'plan_interval': plan.interval, 'email': user.email})

        return Response({"payment_url": payment_url}, status=status.HTTP_200_OK)


class PaypalConfirmSubscription(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, subscription_id):
        subscription = Subscription.objects.filter(
            id=subscription_id,
            payment_provider=PaymentProvider.PAYPAL,
        ).first()

        execute_token = request.data.get("execute_token")

        if not subscription:
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)

        if subscription.status != ActiveStatus.INACTIVE:
            return Response({"error": "Subscription is already active"}, status=status.HTTP_400_BAD_REQUEST)

        paypal_subscription = paypal.execute_billing_agreement(execute_token)

        subscription.external_id = paypal_subscription["id"]
        subscription.save()

        activate_paypal_subscription(subscription, paypal_subscription)

        return Response({"plan_id": subscription.plan_id}, status=status.HTTP_200_OK)


class StripePromoCode(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, promo_code):
        user = request.user
        plan_id = request.query_params.get('plan_id')

        if not plan_id:
            return Response({"error": "Plan id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

        stripe_plan = stripe.Plan.retrieve(plan.stripe_plan_id)

        promo_codes = stripe.PromotionCode.list(code=promo_code,
                                                active=True,
                                                customer=user.stripe_customer_id,
                                                limit=10,
                                                expand=["data.coupon.applies_to"]).data

        if len(promo_codes) == 0:
            general_promo_codes = stripe.PromotionCode.list(code=promo_code,
                                                            active=True,
                                                            limit=10,
                                                            expand=["data.coupon.applies_to"]).data

            promo_codes.extend(general_promo_codes)

        if len(promo_codes) == 0:
            return Response({"error": "Coupon not found"}, status=status.HTTP_404_NOT_FOUND)

        def can_apply_to_product(promo_code):
            return 'applies_to' not in promo_code.coupon or len(promo_code.coupon.applies_to.products) == 0 or stripe_plan.product in promo_code.coupon.applies_to.products

        def can_apply_to_customer(promo_code):
            if promo_code.restrictions.first_time_transaction:
                has_subscribed_before = SubscriptionHistory.objects.filter(user=user).exclude(action=ActionStatus.INCOMPLETE).exists()
                return not has_subscribed_before

            return True

        applicable_promo_codes = [
            promo_code for promo_code in promo_codes
            if can_apply_to_product(promo_code) and can_apply_to_customer(promo_code)
        ]

        if len(applicable_promo_codes) == 0:
            return Response({"error": "Coupon not applicable to this plan"}, status=status.HTTP_400_BAD_REQUEST)

        promo_code = applicable_promo_codes[0]
        duration_in_months = promo_code.coupon.duration_in_months
        if promo_code.coupon.duration == 'forever':
            duration_in_months = None
        if promo_code.coupon.duration == 'once':
            duration_in_months = 1

        json_response = {"promo_code_id": promo_code.id,
                         "percent_off": promo_code.coupon.percent_off,
                         "amount_off": promo_code.coupon.amount_off,
                         "currency": promo_code.coupon.currency,
                         "duration_in_months": duration_in_months}
        return Response(json_response, status=status.HTTP_200_OK)


class StripeSubscribe(APIView):
    def post(self, request, format=None):
        # Get current user & shop from auth token
        user = request.user

        # Get subscription plan from request
        plan_id = request.data.get('plan_id')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'message': 'Subscription does not exists'}, status=status.HTTP_404_NOT_FOUND)

        setup_intent = request.data.get('setup_intent')
        utms_data = request.data.get('utms', None)
        utms = self.get_utm_dict(user, utms_data)
        if setup_intent:
            payment_method = get_payment_method_from_setup_intent(setup_intent)
            subscription_data = {
                "invoice_settings": {'default_payment_method': payment_method.id}
            }
            if utms:
                subscription_data['metadata'] = utms
            stripe.PaymentMethod.attach(payment_method.id, customer=user.stripe_customer_id)
            stripe.Customer.modify(user.stripe_customer_id, **subscription_data)
            user.stripe_payment_method_id = payment_method.id
            user.stripe_card_updated_at = timezone.now()

            if 'card' in payment_method and payment_method.card:
                user.stripe_card_digits = payment_method.card.last4

            user.save()

        promo_code_id = request.data.get('promo_code_id')
        is_upgrade_funnel_coupon = False
        if promo_code_id:
            coupon = stripe.PromotionCode.retrieve(promo_code_id).coupon
            is_upgrade_funnel_coupon = plan.stripe_upgrade_funnel_coupon_id == coupon.id

            if user.has_used_stripe_upgrade_funnel_coupon and is_upgrade_funnel_coupon:
                return Response({'error': 'You have already used this coupon'}, status=status.HTTP_400_BAD_REQUEST)

        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ip_address:
            ip_address = ip_address.split(',')[0].strip()
        
        errors, client_secret = create_stripe_subscription(user, plan, promo_code_id, utms, ip_address)
        if errors:
            return Response({'payment_method_id': errors}, status=status.HTTP_400_BAD_REQUEST)

        if is_upgrade_funnel_coupon:
            user.has_used_stripe_upgrade_funnel_coupon = True
            user.save()

        if client_secret:
            return Response({"client_secret": client_secret, "payment_method_id": user.stripe_payment_method_id}, status=status.HTTP_200_OK)

        send_analytics_data(user.id, 'stripe_subscription_attempt', {'plan_name': plan.name, 'plan_interval': plan.interval, 'email': user.email})

        return Response({"payment_method_id": user.stripe_payment_method_id}, status=status.HTTP_200_OK)

    def get_utm_dict(self, user, utms):
        utm_data = utms or {}
        return {
            "utm_source": utm_data.get('source', user.utm_source),
            "utm_medium": utm_data.get('medium', user.utm_medium),
            "utm_campaign": utm_data.get('campaign', user.utm_campaign),
            "utm_campaignid": utm_data.get('campaignid', user.utm_campaignid),
            "utm_content": utm_data.get('content', user.utm_content),
            "utm_term": utm_data.get('term', user.utm_term),
            "utm_medium_variant": utm_data.get('medium_variant', user.utm_medium_variant),
            "utm_device": utm_data.get('device', user.utm_device),
            "utm_browser": utm_data.get('browser', ''),
            "utm_os": utm_data.get('os', ''),
            "utm_network": utm_data.get('network', user.utm_network),
            "utm_placement": utm_data.get('placement', user.utm_placement),
            "utm_loc_physical": utm_data.get('loc_physical', user.utm_loc_physical),
            "utm_adgroup": utm_data.get('adgroup', user.utm_adgroup),
            "utm_assetgroupid": utm_data.get('assetgroupid', user.utm_assetgroupid),
            "utm_creative": utm_data.get('creative', user.utm_creative),
            "utm_keyword": utm_data.get('keyword', user.utm_keyword),
            "utm_keywordid": utm_data.get('keywordid', user.utm_keywordid),
            "utm_searchterm": utm_data.get('searchterm', user.utm_searchterm),
            "utm_matchtype": utm_data.get('matchtype', user.utm_matchtype),
            "utm_location": utm_data.get('location', user.utm_location),
            "utm_sitelink": utm_data.get('sitelink', user.utm_sitelink),
        }



class StripeSetupIntent(APIView):
    def post(self, request, format=None):
        # Get current user from auth token
        user = request.user

        client_secret = create_stripe_setup_intent(user)

        return Response({"client_secret": client_secret}, status=status.HTTP_200_OK)


class CancelSubscription(APIView):
    def post(self, request, format=None):
        # Get current user from auth token
        user = request.user

        if user.password:
            password_1 = request.data.get('password')
            password_2 = request.data.get('confirm_password')

            if password_1 != password_2:
                return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

            if not user.check_password(password_1):
                return Response({'error': 'Incorrect password'}, status=status.HTTP_400_BAD_REQUEST)

        subscription = Subscription.objects.filter(
            Q(status=ActiveStatus.ACTIVE) | Q(status=ActiveStatus.PAST_DUE),
            user=user
        ).order_by('-created_at').first()

        if subscription is None: 
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)

        cancel_subscription(subscription)

        send_analytics_data(user.id, 'subscription_cancelled', {'email': user.email})

        return Response({}, status=status.HTTP_200_OK)

class PauseSubscription(APIView):
    def put(self, request, format=None):
        # Get current user from auth token
        user = request.user

        subscription = Subscription.objects.filter(
            user=user,
            status=ActiveStatus.ACTIVE, 
            paused_at__isnull=True
        ).annotate(
            pause_count=Count('subscriptionhistory', filter=Q(subscriptionhistory__action=ActionStatus.PAUSED))
        ).order_by('-created_at').first()

        if subscription is None: 
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)
        if subscription.pause_count >= settings.PAUSE_LIMIT:
            return Response({"error": "You can only pause your subscription twice"}, status=status.HTTP_400_BAD_REQUEST)
        
        pause_subscription(subscription)

        if subscription.payment_provider == PaymentProvider.SHOPIFY:
            subscription.paused_at = timezone.now()
            subscription.status = ActiveStatus.PAUSED

        subscription.save()

        send_analytics_data(user.id, 'subscription_paused', {'email': user.email})

        return Response({}, status=status.HTTP_200_OK)

class ResumeSubscription(APIView):
    def put(self, request, format=None):
        # Get current user from auth token
        user = request.user

        subscription = Subscription.objects.filter(user=user, status=ActiveStatus.PAUSED).order_by('-created_at').first()

        if subscription is None: 
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)

        resume_subscription(subscription)

        subscription.paused_at = None

        if subscription.payment_provider == PaymentProvider.SHOPIFY:
            subscription.status = ActiveStatus.ACTIVE

        subscription.save()

        send_analytics_data(user.id, 'subscription_resumed', {'email': user.email})

        return Response({}, status=status.HTTP_200_OK)


class UpdateStripeDetails(APIView):
    def put(self, request, format=None):
        # Get current user from auth token
        user = request.user

        # Get payment method from request
        payment_method_id = request.data.get('payment_method_id')
        name = request.data.get('name')
        if not payment_method_id:
            return Response({"payment_method_id": ["Payment method cannot be empty"]}, status=status.HTTP_400_BAD_REQUEST)
        if not name:
            return Response({"name": ["Name cannot be empty"]}, status=status.HTTP_400_BAD_REQUEST)

        get_or_create_customer(user, name, payment_method_id)

        send_analytics_data(user.id, 'stripe_details_updated', {'email': user.email})

        return Response({}, status=status.HTTP_200_OK)



class GetStripeProration(APIView):
    def get(self, request, plan_id):
        user = request.user

        subscription = Subscription.objects.filter(user=user, status=ActiveStatus.ACTIVE).order_by('-created_at').first()
        promo_code_id = request.GET.get('promo_code_id')

        if subscription is None:
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'message': 'SubscriptionPlan does not exists'}, status=status.HTTP_404_NOT_FOUND)

        proration = get_proration_value(subscription=subscription, plan=plan, user=user, promo_code_id=promo_code_id)

        return Response(proration, status=status.HTTP_200_OK)

class CreateSubscriptionCancellation(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(
        request_body=SubscriptionCancellationSerializer,
        responses={200: "message: Created successfully"}
    )
    
    def post(self, request):
        user = request.user
        serializer = SubscriptionCancellationSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CSBillingActionsLog(APIView):
    permission_classes = [AllowOnlyServerPeerToPeer]

    def get(self, request, format=None):
        limits = CustomerServicePermissionRestrictions.objects.all()
        users = [limit.user for limit in limits]
        data = []

        for user in users:
            data.append(CustomerServiceActionLog.get_summary(user))

        return Response(data, status=status.HTTP_200_OK)
