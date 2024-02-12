from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.admin.options import ModelAdmin
from django.urls import path, reverse


class SecureModelAdmin(ModelAdmin):
    """
    Base ModelAdmin class that disables all export functionality.
    """
    
    def get_actions(self, request):
        actions = super().get_actions(request)
        actions_to_remove = []
        for action_name, action_func in actions.items():
            if 'export' in action_name.lower() or 'csv' in action_name.lower():
                actions_to_remove.append(action_name)
        for action_name in actions_to_remove:
            del actions[action_name]
        return actions
    
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['has_export_permission'] = False
        return super().changelist_view(request, extra_context)


class SecureAdminSite(AdminSite):
    site_header = "Jubilee Administration"
    site_title = "Jubilee Admin"
    index_title = "Welcome to Jubilee Administration"

    def each_context(self, request):
        context = super().each_context(request)
        context['has_export_permission'] = False
        return context
    
    def get_urls(self):
        # Import here to avoid circular import issues
        from authentication.admin_auth import (
            AdminLoginView,
            admin_2fa_verify_view,
            admin_2fa_setup_view,
            AdminForcePasswordChangeView,
        )
        from authentication.admin_passkey import (
            passkey_begin_register,
            passkey_complete_register,
            passkey_begin_auth,
            passkey_complete_auth,
            passkey_register_view,
        )
        
        urls = super().get_urls()
        custom_urls = [
            path('login/', AdminLoginView.as_view(), name='login'),
            path('2fa/setup/', admin_2fa_setup_view, name='admin_2fa_setup'),
            path('2fa/verify/', admin_2fa_verify_view, name='admin_2fa_verify'),
            path('password/change/', AdminForcePasswordChangeView.as_view(), name='admin_force_password_change'),
            path('passkey/register/', passkey_register_view, name='passkey_register'),
            path('passkey/begin-register/', passkey_begin_register, name='passkey_begin_register'),
            path('passkey/complete-register/', passkey_complete_register, name='passkey_complete_register'),
            path('passkey/begin-auth/', passkey_begin_auth, name='passkey_begin_auth'),
            path('passkey/complete-auth/', passkey_complete_auth, name='passkey_complete_auth'),
        ]
        filtered_urls = [url for url in urls if not (hasattr(url, 'name') and url.name == 'login')]
        return custom_urls + filtered_urls

    def get_app_list(self, request, app_label=None):
        app_list = super().get_app_list(request, app_label=app_label)
        if app_label is not None:
            return app_list

        from authentication.models import AdminPasskey
        has_passkeys = AdminPasskey.objects.filter(user=request.user).exists() if request.user.is_authenticated else False

        if request.user.is_authenticated and request.user.is_staff and not has_passkeys:
            passkey_register_url = reverse('secure_admin:passkey_register')
            security_section = {
                'name': 'Security',
                'app_label': 'security',
                'app_url': passkey_register_url,
                'has_module_perms': True,
                'models': [
                    {
                        'name': 'Register a passkey',
                        'object_name': 'passkey_register',
                        'admin_url': passkey_register_url,
                        'add_url': passkey_register_url,
                        'view_only': False,
                    }
                ],
            }
            for i, app in enumerate(app_list):
                if app.get('app_label') == 'dropshipping':
                    app_list.insert(i + 1, security_section)
                    break
            else:
                app_list.append(security_section)

        return app_list


secure_admin_site = SecureAdminSite(name='secure_admin')
