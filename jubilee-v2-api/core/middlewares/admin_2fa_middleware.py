from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth import logout
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class Admin2FAMiddleware(MiddlewareMixin):
    ADMIN_2FA_VERSION = '1.0'
    
    def process_request(self, request):
        if not request.path.startswith('/admin/'):
            return None
        
        if request.path in [
            '/admin/login/',
            '/admin/2fa/setup/',
            '/admin/2fa/verify/',
            '/admin/password/change/',
            '/admin/passkey/begin-auth/',
            '/admin/passkey/complete-auth/',
        ]:
            return None
        
        if request.user.is_authenticated and request.user.is_staff:
            session_2fa_version = request.session.get('admin_2fa_version')
            admin_2fa_verified = request.session.get('admin_2fa_verified', False)
            
            if (session_2fa_version != self.ADMIN_2FA_VERSION or 
                not admin_2fa_verified):
                logout(request)
                request.session.flush()
                return redirect(reverse('secure_admin:login'))
        
        return None
