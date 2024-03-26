from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import Admin2FA
from authentication.admin_auth import generate_totp_secret, generate_backup_codes
from django.conf import settings

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup 2FA for all existing admin users'

    def handle(self, *args, **options):
        staff_users = User.objects.filter(is_staff=True, is_active=True)
        
        for user in staff_users:
            admin_2fa, created = Admin2FA.objects.get_or_create(user=user)
            
            if created or not admin_2fa.totp_secret:
                admin_2fa.totp_secret = generate_totp_secret()
                admin_2fa.backup_codes = generate_backup_codes(
                    getattr(settings, 'ADMIN_2FA_BACKUP_CODES_COUNT', 10)
                )
                admin_2fa.is_enabled = True
                admin_2fa.is_setup_complete = False
                admin_2fa.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'Created 2FA setup for {user.email}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'2FA already exists for {user.email}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Processed {staff_users.count()} staff users')
        )
