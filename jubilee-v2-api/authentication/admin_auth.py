import pyotp
import secrets
import qrcode
import io
import base64
from datetime import timedelta
from django import forms
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView as DjangoLoginView
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.hashers import check_password
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views import View
from django.conf import settings
from django.contrib import messages
from django.core.cache import cache
from django.utils import timezone
from .models import CustomUser, Admin2FA


def generate_totp_secret():
    return pyotp.random_base32()


def generate_backup_codes(count=10):
    return [secrets.token_hex(4).upper() for _ in range(count)]


def get_totp_uri(user, secret):
    issuer = getattr(settings, 'ADMIN_2FA_ISSUER_NAME', 'Jubilee Admin')
    account_name = user.email
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=account_name,
        issuer_name=issuer
    )


def generate_qr_code(uri):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return img_str


def is_password_expired(user):
    expiry_days = getattr(settings, 'ADMIN_PASSWORD_EXPIRY_DAYS', 28)
    baseline = getattr(user, 'password_changed_at', None) or user.date_joined
    if not baseline:
        return False
    return timezone.now() - baseline >= timedelta(days=expiry_days)


def passkey_supported(request):
    """WebAuthn requires secure context: HTTPS or localhost."""
    if request.is_secure():
        return True
    if request.META.get('HTTP_X_FORWARDED_PROTO', '').lower() == 'https':
        return True
    host = request.get_host().split(':')[0].lower()
    return host in ('localhost', '127.0.0.1')


class AdminLoginView(DjangoLoginView):
    template_name = 'admin/secure_login.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['passkey_supported'] = passkey_supported(self.request)
        return context
    
    @method_decorator(csrf_protect)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated and request.user.is_staff:
            from core.middlewares.admin_2fa_middleware import Admin2FAMiddleware
            session_2fa_version = request.session.get('admin_2fa_version')
            admin_2fa_verified = request.session.get('admin_2fa_verified', False)
            
            if (admin_2fa_verified and 
                session_2fa_version == Admin2FAMiddleware.ADMIN_2FA_VERSION):
                return redirect(reverse('secure_admin:index'))
            else:
                logout(request)
                request.session.flush()
        
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form):
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password')
        
        user = authenticate(self.request, username=username, password=password)
        
        if user is None:
            messages.error(self.request, 'Invalid username or password.')
            return self.form_invalid(form)
        
        if not user.is_staff:
            messages.error(self.request, 'You do not have permission to access the admin site.')
            return self.form_invalid(form)
        
        if not user.is_active:
            messages.error(self.request, 'Your account is inactive.')
            return self.form_invalid(form)
        
        admin_2fa, created = Admin2FA.objects.get_or_create(user=user)
        
        if created or not admin_2fa.totp_secret:
            admin_2fa.totp_secret = generate_totp_secret()
            admin_2fa.backup_codes = generate_backup_codes(
                getattr(settings, 'ADMIN_2FA_BACKUP_CODES_COUNT', 10)
            )
            admin_2fa.is_enabled = True
            admin_2fa.is_setup_complete = False
            admin_2fa.save()
        
        # Check if user has completed TOTP app setup
        if not admin_2fa.is_setup_complete:
            self.request.session['admin_2fa_user_id'] = user.id
            self.request.session['admin_2fa_setup_pending'] = True
            return redirect(reverse('secure_admin:admin_2fa_setup'))
        
        # User has completed setup, proceed to verification
        self.request.session['admin_2fa_user_id'] = user.id
        self.request.session['admin_2fa_pending'] = True
        
        return redirect(reverse('secure_admin:admin_2fa_verify'))
    
    def get_success_url(self):
        return reverse('secure_admin:index')


@csrf_protect
@never_cache
def admin_2fa_setup_view(request):
    user_id = request.session.get('admin_2fa_user_id')
    if not user_id or not request.session.get('admin_2fa_setup_pending', False):
        messages.error(request, 'Invalid 2FA setup session.')
        return redirect(reverse('secure_admin:login'))
    
    try:
        user = CustomUser.objects.get(id=user_id, is_staff=True, is_active=True)
    except CustomUser.DoesNotExist:
        messages.error(request, 'User not found.')
        request.session.flush()
        return redirect(reverse('secure_admin:login'))
    
    admin_2fa, created = Admin2FA.objects.get_or_create(user=user)
    
    if not admin_2fa.totp_secret:
        admin_2fa.totp_secret = generate_totp_secret()
        admin_2fa.backup_codes = generate_backup_codes(
            getattr(settings, 'ADMIN_2FA_BACKUP_CODES_COUNT', 10)
        )
        admin_2fa.is_enabled = True
        admin_2fa.save()
    
    if request.method == 'POST':
        otp_code = request.POST.get('otp_code', '').strip()
        
        if not otp_code:
            messages.error(request, 'Please enter the verification code from your authenticator app.')
            totp_uri = get_totp_uri(user, admin_2fa.totp_secret)
            qr_code_img = generate_qr_code(totp_uri)
            context = {
                'user': user,
                'qr_code': qr_code_img,
                'totp_secret': admin_2fa.totp_secret,
            }
            return render(request, 'admin/2fa_setup.html', context)
        
        totp = pyotp.TOTP(admin_2fa.totp_secret)
        if totp.verify(otp_code, valid_window=1):
            admin_2fa.is_setup_complete = True
            admin_2fa.save()
            
            request.session.pop('admin_2fa_setup_pending', None)
            
            request.session['admin_2fa_pending'] = True
            
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            from core.middlewares.admin_2fa_middleware import Admin2FAMiddleware
            request.session['admin_2fa_verified'] = True
            request.session['admin_2fa_version'] = Admin2FAMiddleware.ADMIN_2FA_VERSION
            request.session.pop('admin_2fa_user_id', None)
            
            messages.success(request, '2FA setup complete! You are now logged in.')
            return redirect(reverse('secure_admin:index'))
        else:
            messages.error(request, 'Invalid verification code. Please try again.')
    
    totp_uri = get_totp_uri(user, admin_2fa.totp_secret)
    qr_code_img = generate_qr_code(totp_uri)
    
    context = {
        'user': user,
        'qr_code': qr_code_img,
        'totp_secret': admin_2fa.totp_secret,
    }
    
    return render(request, 'admin/2fa_setup.html', context)


@csrf_protect
@never_cache
def admin_2fa_verify_view(request):
    user_id = request.session.get('admin_2fa_user_id')
    if not user_id or not request.session.get('admin_2fa_pending', False):
        messages.error(request, 'Invalid 2FA verification session.')
        return redirect(reverse('secure_admin:login'))
    
    try:
        user = CustomUser.objects.get(id=user_id, is_staff=True, is_active=True)
    except CustomUser.DoesNotExist:
        messages.error(request, 'User not found.')
        request.session.flush()
        return redirect(reverse('secure_admin:login'))
    
    admin_2fa = Admin2FA.objects.get(user=user)
    
    if not admin_2fa.is_setup_complete:
        messages.warning(request, 'Please complete 2FA setup first.')
        request.session['admin_2fa_setup_pending'] = True
        return redirect(reverse('secure_admin:admin_2fa_setup'))
    
    if request.method == 'POST':
        otp_code = request.POST.get('otp_code', '').strip()
        backup_code = request.POST.get('backup_code', '').strip()
        
        if not otp_code and not backup_code:
            messages.error(request, 'Please enter an OTP code from your authenticator app or a backup code.')
            return render(request, 'admin/2fa_verify.html', {'user': user})
        
        rate_limit_key = f'admin_2fa_rate_limit_{user.id}'
        attempts = cache.get(rate_limit_key, 0)
        max_attempts = getattr(settings, 'ADMIN_2FA_RATE_LIMIT_REQUESTS', 5)
        
        if attempts >= max_attempts:
            messages.error(request, 'Too many failed attempts. Please try again later.')
            return render(request, 'admin/2fa_verify.html', {'user': user})
        
        verified = False
        
        if otp_code:
            totp = pyotp.TOTP(admin_2fa.totp_secret)
            if totp.verify(otp_code, valid_window=1):
                verified = True
        
        elif backup_code:
            if backup_code in admin_2fa.backup_codes:
                if admin_2fa.last_used_backup_code == backup_code:
                    messages.error(request, 'This backup code has already been used.')
                    cache.set(rate_limit_key, attempts + 1, timeout=3600)
                    return render(request, 'admin/2fa_verify.html', {'user': user})
                
                admin_2fa.backup_codes.remove(backup_code)
                admin_2fa.last_used_backup_code = backup_code
                admin_2fa.save()
                verified = True
        
        if verified:
            cache.delete(rate_limit_key)
            
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            from core.middlewares.admin_2fa_middleware import Admin2FAMiddleware
            request.session['admin_2fa_verified'] = True
            request.session['admin_2fa_version'] = Admin2FAMiddleware.ADMIN_2FA_VERSION
            request.session.pop('admin_2fa_user_id', None)
            request.session.pop('admin_2fa_pending', None)
            
            # Enforce password expiry after successful 2FA
            if is_password_expired(user):
                request.session['force_password_change'] = True
                expiry_days = getattr(settings, 'ADMIN_PASSWORD_EXPIRY_DAYS', 28)
                messages.warning(
                    request,
                    f'Your password has expired. Please set a new password to continue (required every {expiry_days} days).'
                )
                return redirect(reverse('secure_admin:admin_force_password_change'))
            
            messages.success(request, 'Login successful!')
            return redirect(reverse('secure_admin:index'))
        else:
            cache.set(rate_limit_key, attempts + 1, timeout=3600)
            messages.error(request, 'Invalid OTP or backup code. Please try again.')
    
    return render(request, 'admin/2fa_verify.html', {'user': user})


class AdminForcePasswordChangeForm(SetPasswordForm):

    def clean_new_password2(self):
        new_password2 = super().clean_new_password2()
        user = self.user
        previous_hash = getattr(user, 'previous_password_hash', '')

        if previous_hash and check_password(new_password2, previous_hash):
            raise forms.ValidationError(
                'You cannot reuse your previous password. Please choose a different password.',
                code='password_reuse',
            )

        return new_password2


class AdminForcePasswordChangeView(View):

    template_name = 'admin/force_password_change.html'

    @method_decorator(csrf_protect)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            messages.error(request, 'You must be logged in to change your password.')
            return redirect(reverse('secure_admin:login'))

        if not request.session.get('force_password_change') and not is_password_expired(request.user):
            return redirect(reverse('secure_admin:index'))

        return super().dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        form = AdminForcePasswordChangeForm(user=request.user)
        return render(request, self.template_name, {'form': form})

    def post(self, request, *args, **kwargs):
        user = request.user
        form = AdminForcePasswordChangeForm(user=user, data=request.POST)

        if form.is_valid():
            old_password_hash = user.password

            form.save()

            user.previous_password_hash = old_password_hash
            user.password_changed_at = timezone.now()
            user.save(update_fields=['previous_password_hash', 'password_changed_at'])

            request.session.pop('force_password_change', None)

            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')

            messages.success(request, 'Your password has been updated successfully.')
            return redirect(reverse('secure_admin:index'))

        return render(request, self.template_name, {'form': form})
