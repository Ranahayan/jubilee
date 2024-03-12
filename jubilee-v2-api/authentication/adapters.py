from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.utils import perform_login
from allauth.account import app_settings
from authentication.models import CustomUser
from authentication.utils import extract_referrer_source


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        user.name = data.get('name')
        
        utm_params = request.session.get('oauth_utm_params', {})
        
        def get_param(param_name):
            return utm_params.get(param_name) or request.POST.get(param_name) or request.GET.get(param_name)
        
        utm_campaign = get_param('utm_campaign')
        utm_campaignid = get_param('utm_campaignid')
        utm_source = utm_params.get('utm_source') or extract_referrer_source(request)
        utm_medium = get_param('utm_medium')
        utm_term = get_param('utm_term')
        utm_content = get_param('utm_content')
        utm_medium_variant = get_param('utm_medium_variant')
        utm_device = get_param('utm_device')
        utm_network = get_param('utm_network')
        utm_placement = get_param('utm_placement')
        utm_loc_physical = get_param('utm_loc_physical')
        utm_adgroup = get_param('utm_adgroup')
        utm_assetgroupid = get_param('utm_assetgroupid')
        utm_creative = get_param('utm_creative')
        utm_keyword = get_param('utm_keyword')
        utm_keywordid = get_param('utm_keywordid')
        utm_searchterm = get_param('utm_searchterm')
        utm_matchtype = get_param('utm_matchtype')
        utm_location = get_param('utm_location')
        utm_sitelink = get_param('utm_sitelink')
        
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
        
        if 'oauth_utm_params' in request.session:
            del request.session['oauth_utm_params']
        
        return user

    def is_auto_signup_allowed(self, request, sociallogin):
        if sociallogin.is_existing:
            return True
        return super().is_auto_signup_allowed(request, sociallogin)

    def pre_social_login(self, request, sociallogin):
        # Ensure this method gets called on a fresh social login
        if sociallogin.is_existing:
            return

        email_address = sociallogin.account.extra_data.get('email')
        if not email_address:
            return

        try:
            # Look up the user by email
            user = CustomUser.objects.get(email=email_address)
            # If the user exists, connect the social login to this user
            sociallogin.connect(request, user)
            perform_login(request, user, app_settings.EmailVerificationMethod.NONE)
        except CustomUser.DoesNotExist:
            # If no user exists with this email, continue the normal flow
            pass
