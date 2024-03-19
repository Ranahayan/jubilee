"""
WebAuthn passkey support for Django Admin login.
Enables Touch ID, Face ID, Windows Hello, or security keys for admin authentication.
"""
import base64
import json
from urllib.parse import urlunsplit

from django.contrib.auth import login
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache
from django.conf import settings

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers import options_to_json, base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import PublicKeyCredentialDescriptor

from .models import AdminPasskey, Admin2FA, CustomUser


def get_expected_origins(request):
    """
    Return list of expected origins for WebAuthn verification.
    Respects X-Forwarded-Proto when behind a reverse proxy (HTTPS).
    """
    configured = getattr(settings, 'WEBAUTHN_EXPECTED_ORIGINS', None)
    if configured:
        return configured if isinstance(configured, (list, tuple)) else [configured]

    host = request.get_host().split(':')[0]
    proto = request.scheme
    forwarded_proto = request.META.get('HTTP_X_FORWARDED_PROTO')
    if forwarded_proto:
        proto = forwarded_proto.split(',')[0].strip().lower()
    origin = urlunsplit((proto, request.get_host(), '', '', ''))
    return [origin.rstrip('/')]


def get_rp_id(request):
    """Relying Party ID for WebAuthn (typically the host)."""
    return request.get_host().split(':')[0]


@csrf_protect
@never_cache
@require_http_methods(['POST'])
def passkey_begin_register(request):
    """Generate registration options for a new passkey."""
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    user = request.user
    rp_id = get_rp_id(request)
    expected_origins = get_expected_origins(request)

    existing = AdminPasskey.objects.filter(user=user)
    exclude_credentials = [
        PublicKeyCredentialDescriptor(
            id=base64url_to_bytes(pk.credential_id),
            transports=pk.transports or None,
        )
        for pk in existing
    ]

    options = generate_registration_options(
        rp_id=rp_id,
        rp_name=getattr(settings, 'WEBAUTHN_RP_NAME', 'Jubilee Admin'),
        user_name=user.email,
        user_id=user.id.to_bytes(16, 'big'),
        user_display_name=user.email,
        exclude_credentials=exclude_credentials or None,
    )

    request.session['webauthn_register_challenge'] = bytes_to_base64url(options.challenge)
    request.session['webauthn_register_rp_id'] = rp_id

    return JsonResponse(json.loads(options_to_json(options)))


@csrf_protect
@never_cache
@require_http_methods(['POST'])
def passkey_complete_register(request):
    """Verify registration response and store the new passkey."""
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    challenge_b64 = request.session.pop('webauthn_register_challenge', None)
    rp_id = request.session.get('webauthn_register_rp_id')
    if not challenge_b64 or not rp_id:
        return JsonResponse({'error': 'Registration session expired'}, status=400)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    expected_origins = get_expected_origins(request)
    expected_challenge = base64url_to_bytes(challenge_b64)

    try:
        verification = verify_registration_response(
            credential=body,
            expected_challenge=expected_challenge,
            expected_rp_id=rp_id,
            expected_origin=expected_origins,
            require_user_verification=False,
        )
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

    credential_id_b64 = bytes_to_base64url(verification.credential_id)
    if AdminPasskey.objects.filter(credential_id=credential_id_b64).exists():
        return JsonResponse({'error': 'Credential already registered'}, status=400)

    AdminPasskey.objects.create(
        user=request.user,
        credential_id=credential_id_b64,
        public_key=bytes(verification.credential_public_key),
        sign_count=verification.sign_count,
        transports=body.get('response', {}).get('transports', []),
    )

    return JsonResponse({'success': True, 'redirect': reverse('secure_admin:index')})


@csrf_protect
@never_cache
@require_http_methods(['POST'])
def passkey_begin_auth(request):
    """Generate authentication options for passkey login."""
    if request.user.is_authenticated and request.user.is_staff:
        return JsonResponse({'error': 'Already logged in'}, status=400)

    rp_id = get_rp_id(request)
    allow_credentials = []
    # Discovery: we don't know the user yet; allow any credential
    # The client will send us the credential, we'll look up the user
    all_passkeys = AdminPasskey.objects.select_related('user')
    for pk in all_passkeys:
        try:
            cred_id_bytes = base64url_to_bytes(pk.credential_id)
        except Exception:
            continue
        allow_credentials.append(
            PublicKeyCredentialDescriptor(id=cred_id_bytes, transports=pk.transports or None)
        )

    options = generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=allow_credentials if allow_credentials else None,
    )

    request.session['webauthn_auth_challenge'] = bytes_to_base64url(options.challenge)
    request.session['webauthn_auth_rp_id'] = rp_id

    return JsonResponse(json.loads(options_to_json(options)))


@csrf_protect
@never_cache
@require_http_methods(['POST'])
def passkey_complete_auth(request):
    """
    Verify authentication response and log the user in.
    After passkey auth, redirect to 2FA verification (same as password login).
    """
    if request.user.is_authenticated and request.user.is_staff:
        return redirect(reverse('secure_admin:index'))

    challenge_b64 = request.session.pop('webauthn_auth_challenge', None)
    rp_id = request.session.get('webauthn_auth_rp_id')
    if not challenge_b64 or not rp_id:
        return JsonResponse({'error': 'Authentication session expired'}, status=400)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    credential_id = body.get('id') or body.get('rawId')
    if not credential_id:
        return JsonResponse({'error': 'Missing credential id'}, status=400)

    # credential_id from client is base64url string; normalize for lookup
    if isinstance(credential_id, str):
        try:
            cred_id_bytes = base64url_to_bytes(credential_id)
        except Exception:
            try:
                cred_id_bytes = base64.urlsafe_b64decode(credential_id + '==')
            except Exception:
                return JsonResponse({'error': 'Invalid credential id'}, status=400)
    else:
        cred_id_bytes = bytes(credential_id)

    cred_id_b64 = bytes_to_base64url(cred_id_bytes)
    passkey = AdminPasskey.objects.filter(credential_id=cred_id_b64).select_related('user').first()
    if not passkey:
        return JsonResponse({'error': 'Unknown credential'}, status=400)

    user = passkey.user
    if not user.is_staff or not user.is_active:
        return JsonResponse({'error': 'User not allowed'}, status=403)

    expected_origins = get_expected_origins(request)
    expected_challenge = base64url_to_bytes(challenge_b64)

    try:
        verification = verify_authentication_response(
            credential=body,
            expected_challenge=expected_challenge,
            expected_rp_id=rp_id,
            expected_origin=expected_origins,
            credential_public_key=bytes(passkey.public_key),
            credential_current_sign_count=passkey.sign_count,
            require_user_verification=False,
        )
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

    passkey.sign_count = verification.new_sign_count
    passkey.save(update_fields=['sign_count'])

    admin_2fa, _ = Admin2FA.objects.get_or_create(user=user)
    if not admin_2fa.totp_secret:
        from .admin_auth import generate_totp_secret, generate_backup_codes
        admin_2fa.totp_secret = generate_totp_secret()
        admin_2fa.backup_codes = generate_backup_codes(
            getattr(settings, 'ADMIN_2FA_BACKUP_CODES_COUNT', 10)
        )
        admin_2fa.is_enabled = True
        admin_2fa.is_setup_complete = False
        admin_2fa.save()

    if not admin_2fa.is_setup_complete:
        request.session['admin_2fa_user_id'] = user.id
        request.session['admin_2fa_setup_pending'] = True
        return JsonResponse({
            'success': True,
            'redirect': reverse('secure_admin:admin_2fa_setup'),
        })

    request.session['admin_2fa_user_id'] = user.id
    request.session['admin_2fa_pending'] = True

    user.backend = 'django.contrib.auth.backends.ModelBackend'
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({
        'success': True,
        'redirect': reverse('secure_admin:admin_2fa_verify'),
    })


@never_cache
def passkey_register_view(request):
    """Page for registering a new passkey (after login with password + 2FA)."""
    if not request.user.is_authenticated or not request.user.is_staff:
        return redirect(reverse('secure_admin:login'))

    return render(request, 'admin/passkey_register.html', {
        'has_passkeys': AdminPasskey.objects.filter(user=request.user).exists(),
    })
