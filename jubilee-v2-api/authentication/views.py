import re
import shopify
import binascii
import os
import ssl
from datetime import timezone
from typing import List
from django.db.models import Q

from django.shortcuts import redirect
from dropshipping.services import get_shop_details
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from authentication.email import send_reset_password_email
from .models import Shop, CustomUser, SignupOrigin, PaymentProvider, UserReview, UserShopConnection, LoginActivity
from .serializers import ShopSerializer, ResetUserPasswordSerializer
from django.conf import settings

from dj_rest_auth.serializers import JWTSerializer
from dj_rest_auth.utils import jwt_encode
from dj_rest_auth.jwt_auth import set_jwt_cookies
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from webhooks.subscription import create_shopify_webhooks
from django.utils.crypto import get_random_string
from authentication.utils import manage_stripe_user_payment_provider
from dj_rest_auth.views import PasswordChangeView as DefaultPasswordChangeView
from .serializers import PasswordChangeSerializer, RegisterUserSerializer, LoginUserSerializer, ForgotPasswordSerializer, ConnectShopSerializer, EditUserSerializer
from drf_yasg.utils import swagger_auto_schema
from authentication.utils import send_analytics_data
from dropshipping.models import DropshipSettings
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from authentication.adapters import CustomSocialAccountAdapter
import logging

logger = logging.getLogger(__name__)

ssl._create_default_https_context = ssl._create_unverified_context  # TODO: Fix this (only for development)

S_API_VERSION = settings.SHOPIFY_API_VERSION
S_API_KEY = settings.SHOPIFY_CLIENT_KEY
S_API_SECRET = settings.SHOPIFY_CLIENT_SECRET
S_API_SCOPES = settings.SHOPIFY_SCOPES
S_API_NEW_SCOPES = settings.SHOPIFY_NEW_SCOPES
API_URL = settings.API_URL
FRONTEND_URL = settings.FRONTEND_URL

shopify.Session.setup(api_key=S_API_KEY, secret=S_API_SECRET)


def new_session(shop_url):
    return shopify.Session(shop_url, S_API_VERSION)


def uid():
    return binascii.b2a_hex(os.urandom(15)).decode("utf-8")

def get_new_scopes_for_shop(shop_url: str) -> List[str]:
    new_scopes = []
    shop = Shop.objects.filter(url=shop_url).first()

    if not shop:
        return [scope for scope, _ in S_API_NEW_SCOPES]

    try:
        user_shop_connection = UserShopConnection.objects.get(owner=shop.owner, shop_url=shop_url)
    except UserShopConnection.DoesNotExist:
        return [scope for scope, _ in S_API_NEW_SCOPES]

    dropship_settings = DropshipSettings.objects.filter(Q(shop=shop) | Q(user=shop.owner) ).first()

    for new_scope, add_date in S_API_NEW_SCOPES:
        add_date = add_date.replace(tzinfo=timezone.utc)
        if (hasattr(user_shop_connection, 'created_at') and add_date < user_shop_connection.created_at) or not (dropship_settings and dropship_settings.shopify_location_id):
            new_scopes.append(new_scope)

    return new_scopes

def extract_referrer_source(request):
    utm_source = request.data.get('utm_source')
    if utm_source:
        return utm_source

    referrer = request.META.get('HTTP_REFERER', '')
    match = re.search(r"^(?:https?:\/\/)?(?:www\.)?([^\/\?]+)", referrer)

    if not match:
        return ""

    domain_parts = match.group(1).split('.')

    if len(domain_parts) >= 3 and domain_parts[-2] in {"co", "com", "org", "net"}:
        return domain_parts[-3]  # Ex: www.domain.co.uk → domain
    if len(domain_parts) >= 2:
        return domain_parts[-2]  # Ex: shop.shopify.com → shopify

    return ""

class ShopifyCheckPerms(APIView):
    def get(self, request, format=None):
        try:
            params = request.GET.dict()
            shop_url = params['shop']
        except KeyError:
            return Response({'message': 'Shop not found'}, status=status.HTTP_400_BAD_REQUEST)

        new_scopes = get_new_scopes_for_shop(shop_url=shop_url)

        # Set random state for extra security
        state = uid()
        request.session['shopify_oauth_state_param'] = state

        session = new_session(shop_url)
        auth_url = session.create_permission_url(S_API_SCOPES + new_scopes, API_URL + '/shopify_token', state)

        return redirect(auth_url)


class ShopifyGetPermanentToken(APIView):
    def get(self, request, format=None):
        try:
            params = request.GET.dict()
            shop_url = params['shop']
            oauth_state = params['state']
        except KeyError:
            return Response({'message': 'Shop not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Check random state that was generated before
        if request.session.get('shopify_oauth_state_param') != oauth_state:
            return Response({'message': 'Invalid login attempt'}, status=status.HTTP_403_FORBIDDEN)
        else:
            request.session.pop('shopify_oauth_state_param', None)

        session = new_session(shop_url)
        access_token = session.request_token(params)

        # Create or update Shop
        try:
            shop = Shop.objects.filter(url=shop_url).latest('last_updated_at')
            if shop is None:
                raise Shop.DoesNotExist
        except Shop.DoesNotExist:
            with shopify.Session.temp(shop_url, S_API_VERSION, access_token):
                # Check if we have existing user with shopify email
                s_shop = shopify.Shop.current()
                s_shop_owner_email = s_shop.attributes['email']

                try:
                    s_shop_owner = CustomUser.objects.get(email__iexact=s_shop_owner_email)
                except CustomUser.DoesNotExist:
                    # Create user with Shopify's email & name (without password)
                    s_shop_owner_name = s_shop.attributes['shop_owner']
                    s_shop_owner = CustomUser(email=s_shop_owner_email, name=s_shop_owner_name, utm_source='shopify')
                    s_shop_owner.save()
                    manage_stripe_user_payment_provider(s_shop_owner_email)

                # Create Shop with owner
                shop = Shop(url=shop_url, type=Shop.ShopType.SHOPIFY, owner=s_shop_owner)

        shop_token = uid()

        shop.shopify_access_token = access_token
        shop.temp_login_token = shop_token  # Front uses this at /shop-login, to get JWT creds for shop owner
        shop.is_active = True
        shop.save()

        try:
            dropshipping_settings = DropshipSettings.objects.filter(user=s_shop_owner).first()
            # recover dropshipping settings by user
            if dropshipping_settings is None:
                dropshipping_settings = DropshipSettings.objects.create(user=s_shop_owner, shop=shop)
                shop_details = get_shop_details(shop)
                dropshipping_settings.invoice_store_name = shop_details['name']
                dropshipping_settings.invoice_contact_email = shop_details['contactEmail']
                dropshipping_settings.invoice_website = shop_details['primaryDomain']['host']
            
            dropshipping_settings.shop = shop
            dropshipping_settings.save()
        except Exception as e:
            logger.error(e)

        # Create webhooks
        with shopify.Session.temp(shop_url, S_API_VERSION, access_token):
            create_shopify_webhooks()

        return redirect(FRONTEND_URL + "/login/store/" + shop_token)


class ShopLogin(APIView):
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        shop_token = request.data['shop_token']

        try:
            shop = Shop.objects.get(temp_login_token=shop_token)

            send_analytics_data(shop.owner.id, 'shopify_login', {"shop_url": shop.url})

            access_token, refresh_token = jwt_encode(shop.owner)
            data = {
                'user': shop.owner,
                'access': access_token,
                'refresh': refresh_token,
            }
            serializer = JWTSerializer(data)
            response = Response(serializer.data, status=status.HTTP_200_OK)
            set_jwt_cookies(response, access_token, refresh_token)
            shop.temp_login_token = None
            shop.save()
            return response
        except Shop.DoesNotExist:
            return Response({"message": "Invalid login attempt"}, status=status.HTTP_403_FORBIDDEN)


class LoginView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        request_body=LoginUserSerializer,
        responses={200: "Success", 400: "Bad Request"},
    )
    def post(self, request, format=None):
        email = request.data['email']
        password = request.data['password']
        ps_xid = request.data.get('ps_xid')

        utm_campaign = request.data.get('utm_campaign')
        utm_campaignid = request.data.get('utm_campaignid')
        utm_source = extract_referrer_source(request)
        utm_medium = request.data.get('utm_medium')
        utm_term = request.data.get('utm_term')
        utm_content = request.data.get('utm_content')
        utm_medium_variant = request.data.get('utm_medium_variant')
        utm_device = request.data.get('utm_device')
        utm_network = request.data.get('utm_network')
        utm_placement = request.data.get('utm_placement')
        utm_loc_physical = request.data.get('utm_loc_physical')
        utm_adgroup = request.data.get('utm_adgroup')
        utm_assetgroupid = request.data.get('utm_assetgroupid')
        utm_creative = request.data.get('utm_creative')
        utm_keyword = request.data.get('utm_keyword')
        utm_keywordid = request.data.get('utm_keywordid')
        utm_searchterm = request.data.get('utm_searchterm')
        utm_matchtype = request.data.get('utm_matchtype')
        utm_location = request.data.get('utm_location')
        utm_sitelink = request.data.get('utm_sitelink')
        
        try:
            user = CustomUser.objects.filter(email__iexact=email).first()
            if not user:
                raise CustomUser.DoesNotExist
        except CustomUser.DoesNotExist:
            return Response({"message": "Invalid password/email"}, status=status.HTTP_400_BAD_REQUEST)

        # check users password
        if not user.check_password(password):
            return Response({"message": "Invalid password/email"}, status=status.HTTP_400_BAD_REQUEST)

        if ps_xid:
            user.ps_xid = ps_xid
            user.save()

        if utm_campaign or utm_source or utm_medium or utm_term:
            user.utm_campaign = utm_campaign
            user.utm_campaignid = utm_campaignid
            user.utm_source = utm_source
            user.utm_medium = utm_medium
            user.utm_term = utm_term
            user.utm_content = utm_content
            user.utm_medium_variant = utm_medium_variant
            user.utm_device = utm_device
            user.utm_network = utm_network
            user.utm_placement = utm_placement
            user.utm_loc_physical = utm_loc_physical
            user.utm_adgroup = utm_adgroup
            user.utm_assetgroupid = utm_assetgroupid
            user.utm_creative = utm_creative
            user.utm_keyword = utm_keyword
            user.utm_keywordid = utm_keywordid
            user.utm_searchterm = utm_searchterm
            user.utm_matchtype = utm_matchtype
            user.utm_location = utm_location
            user.utm_sitelink = utm_sitelink
            user.save(update_fields=[
                'utm_campaign', 'utm_campaignid', 'utm_source', 'utm_medium', 'utm_term',
                'utm_content', 'utm_medium_variant', 'utm_device', 
                'utm_network', 'utm_placement', 'utm_loc_physical',
                'utm_adgroup', 'utm_assetgroupid', 'utm_creative',
                'utm_keyword', 'utm_keywordid', 'utm_searchterm',
                'utm_matchtype', 'utm_location', 'utm_sitelink'
            ])

        send_analytics_data(user.id, 'direct_login', {"email": email})

        access_token, refresh_token = jwt_encode(user)
        data = {
            'user': user,
            'access': access_token,
            'refresh': refresh_token,
        }
        serializer = JWTSerializer(data)
        response = Response(serializer.data, status=status.HTTP_200_OK)
        set_jwt_cookies(response, access_token, refresh_token)
        LoginActivity.objects.create(user=user)
        return response



class ForgetPasswordView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        request_body=ForgotPasswordSerializer,
        responses={200: "Success", 400: "Bad Request"},
    )

    def post(self, request, format=None):
        email = request.data['email']

        try:
            random_token = get_random_string(length=32)
            user = CustomUser.objects.get(email__iexact=email)

            user.reset_token = random_token
            user.save()
            send_reset_password_email(user.email, self.__generate_reset_password_link(token=random_token))
            response_message = {
                "message": "Email has been sent"
            }
            response = Response(response_message, status=status.HTTP_200_OK)
            return response
        except CustomUser.DoesNotExist:
            return Response({"message": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)

    def __generate_reset_password_link(self, token):
        return f'{settings.FRONTEND_URL}/forgot-password?token={token}'


class ResetUserPasswordView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        request_body=ResetUserPasswordSerializer,
        responses={200: "Success", 400: "Bad Request"},
    )
    def post(self, request):
        serializer = ResetUserPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token = request.data['token']
            password = request.data['password']
            try:
                user = CustomUser.objects.get(reset_token=token)
            except CustomUser.DoesNotExist:
                return Response({"message": "Invalid Token Provided"}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.reset_token = None
            user.save()
            # Generate and return token for user
            access, refresh = jwt_encode(user)
            data = {
                'user': user,
                'access': access,
                'refresh': refresh,
            }
            serializer = JWTSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=400)


class GetShop(APIView):
    def get(self, request, format=None):
        shop = Shop.objects.get_by_user(request.user)
        if not shop:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ShopSerializer(shop)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConnectShopify(APIView):
    @swagger_auto_schema(
        request_body=ConnectShopSerializer,
        responses={200: "Success", 400: "Bad Request"},
    )
    def post(self, request, format=None):
        shop_url = request.data['shop_url']

        new_scopes = get_new_scopes_for_shop(shop_url=shop_url)

        state = uid()
        request.session['shopify_oauth_state_param'] = state

        session = new_session(shop_url)
        auth_url = session.create_permission_url(S_API_SCOPES + new_scopes, API_URL + '/shopify_login', state)

        return Response({'auth_url': auth_url}, status=status.HTTP_200_OK)


class RegisterUser(APIView):
    @swagger_auto_schema(
        request_body=RegisterUserSerializer,
        responses={200: "Success", 400: "Bad Request"},
    )
    def post(self, request, format=None):
        email = request.data['email'].lower()
        name = request.data['name']
        ps_xid = request.data.get('ps_xid')

        utm_campaign = request.data.get('utm_campaign')
        utm_campaignid = request.data.get('utm_campaignid')
        utm_source = extract_referrer_source(request)
        utm_medium = request.data.get('utm_medium')
        utm_term = request.data.get('utm_term')
        utm_content = request.data.get('utm_content')
        utm_medium_variant = request.data.get('utm_medium_variant')
        utm_device = request.data.get('utm_device')
        utm_network = request.data.get('utm_network')
        utm_placement = request.data.get('utm_placement')
        utm_loc_physical = request.data.get('utm_loc_physical')
        utm_adgroup = request.data.get('utm_adgroup')
        utm_assetgroupid = request.data.get('utm_assetgroupid')
        utm_creative = request.data.get('utm_creative')
        utm_keyword = request.data.get('utm_keyword')
        utm_keywordid = request.data.get('utm_keywordid')
        utm_searchterm = request.data.get('utm_searchterm')
        utm_matchtype = request.data.get('utm_matchtype')
        utm_location = request.data.get('utm_location')
        utm_sitelink = request.data.get('utm_sitelink')
        
        if not re.match(r'^[\w\.\+-]+@[\w\.-]+\.\w+$', email):
            return Response({'email': ['Invalid email format']}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=email).exists():
            return Response({'email': ['Email already exists']}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser(
            email=email,
            name=name,
            signup_origin=SignupOrigin.DIRECT,
            payment_provider=PaymentProvider.STRIPE,
            ps_xid=ps_xid,
            utm_campaign=utm_campaign,
            utm_campaignid=utm_campaignid,
            utm_source=utm_source,
            utm_medium=utm_medium,
            utm_term=utm_term,
            utm_content=utm_content,
            utm_medium_variant=utm_medium_variant,
            utm_device=utm_device,
            utm_network=utm_network,
            utm_placement=utm_placement,
            utm_loc_physical=utm_loc_physical,
            utm_adgroup=utm_adgroup,
            utm_assetgroupid=utm_assetgroupid,
            utm_creative=utm_creative,
            utm_keyword=utm_keyword,
            utm_keywordid=utm_keywordid,
            utm_searchterm=utm_searchterm,
            utm_matchtype=utm_matchtype,
            utm_location=utm_location,
            utm_sitelink=utm_sitelink,
        )
        user.save()
        send_analytics_data(user.id, "direct_signup", {"email": email})
        LoginActivity.objects.create(user=user)

        # Generate and return token for user
        access_token, refresh_token = jwt_encode(user)
        data = {
            'user': user,
            'access': access_token,
            'refresh': refresh_token,
        }
        serializer = JWTSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordChangeView(DefaultPasswordChangeView):
    serializer_class = PasswordChangeSerializer


class CreateUserReview(APIView):
    def post(self, request, format=None):
        rating = request.data['rating']
        user = request.user
        feedback = request.data['feedback']

        UserReview.objects.create(rating=rating, user=user, feedback=feedback)

        return Response({}, status=status.HTTP_201_CREATED)


class EditUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = EditUserSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data.get('email')
        name = serializer.validated_data.get('name')
        onboarding_choices = serializer.validated_data.get('onboarding_choices')

        if email:
            email = CustomUser.objects.normalize_email(email)

            email_is_taken = CustomUser.objects.filter(
                email=email).exclude(id=user.id).exists()

            if email_is_taken:
                raise serializers.ValidationError("Email is already taken")

            user.email = email

        if name:
            user.name = name

        if onboarding_choices:
            user.onboarding_choices = onboarding_choices

        user.save()

        return Response({}, status=status.HTTP_200_OK)


class DropGeniusEmailChange(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        old_email = request.data['old_email']
        new_email = request.data['new_email']
        secret = request.data['secret']

        if secret != settings.DG_SECRET:
            return Response({'message': 'Invalid secret'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = CustomUser.objects.get(email__iexact=old_email)
        except CustomUser.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user.email = new_email
        user.save()

        return Response({}, status=status.HTTP_200_OK)


class CustomFacebookOAuth2Adapter(FacebookOAuth2Adapter):
    adapter = CustomSocialAccountAdapter


class FacebookLogin(SocialLoginView):
    adapter_class = CustomFacebookOAuth2Adapter
    
    def post(self, request, *args, **kwargs):
        utm_params = {
            'utm_campaign': request.data.get('utm_campaign'),
            'utm_campaignid': request.data.get('utm_campaignid'),
            'utm_source': request.data.get('utm_source'),
            'utm_medium': request.data.get('utm_medium'),
            'utm_term': request.data.get('utm_term'),
            'utm_content': request.data.get('utm_content'),
            'utm_medium_variant': request.data.get('utm_medium_variant'),
            'utm_device': request.data.get('utm_device'),
            'utm_network': request.data.get('utm_network'),
            'utm_placement': request.data.get('utm_placement'),
            'utm_loc_physical': request.data.get('utm_loc_physical'),
            'utm_adgroup': request.data.get('utm_adgroup'),
            'utm_assetgroupid': request.data.get('utm_assetgroupid'),
            'utm_creative': request.data.get('utm_creative'),
            'utm_keyword': request.data.get('utm_keyword'),
            'utm_keywordid': request.data.get('utm_keywordid'),
            'utm_searchterm': request.data.get('utm_searchterm'),
            'utm_matchtype': request.data.get('utm_matchtype'),
            'utm_location': request.data.get('utm_location'),
            'utm_sitelink': request.data.get('utm_sitelink'),
        }
        
        request.session['oauth_utm_params'] = {k: v for k, v in utm_params.items() if v is not None}
        return super().post(request, *args, **kwargs)


class CustomGoogleOAuth2Adapter(GoogleOAuth2Adapter):
    adapter = CustomSocialAccountAdapter


class GoogleLogin(SocialLoginView):
    adapter_class = CustomGoogleOAuth2Adapter
    client_class = OAuth2Client
    
    def post(self, request, *args, **kwargs):
        utm_params = {
            'utm_campaign': request.data.get('utm_campaign'),
            'utm_campaignid': request.data.get('utm_campaignid'),
            'utm_source': request.data.get('utm_source'),
            'utm_medium': request.data.get('utm_medium'),
            'utm_term': request.data.get('utm_term'),
            'utm_content': request.data.get('utm_content'),
            'utm_medium_variant': request.data.get('utm_medium_variant'),
            'utm_device': request.data.get('utm_device'),
            'utm_network': request.data.get('utm_network'),
            'utm_placement': request.data.get('utm_placement'),
            'utm_loc_physical': request.data.get('utm_loc_physical'),
            'utm_adgroup': request.data.get('utm_adgroup'),
            'utm_assetgroupid': request.data.get('utm_assetgroupid'),
            'utm_creative': request.data.get('utm_creative'),
            'utm_keyword': request.data.get('utm_keyword'),
            'utm_keywordid': request.data.get('utm_keywordid'),
            'utm_searchterm': request.data.get('utm_searchterm'),
            'utm_matchtype': request.data.get('utm_matchtype'),
            'utm_location': request.data.get('utm_location'),
            'utm_sitelink': request.data.get('utm_sitelink'),
        }
        
        request.session['oauth_utm_params'] = {k: v for k, v in utm_params.items() if v is not None}
        return super().post(request, *args, **kwargs)
