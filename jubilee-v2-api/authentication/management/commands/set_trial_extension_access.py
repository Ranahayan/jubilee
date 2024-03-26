from django.core.management.base import BaseCommand, CommandError

from authentication.models import (
    CustomUser,
    CustomerServicePermissionRestrictions,
)


class Command(BaseCommand):
    help = "Grant or revoke trial extension access for a staff user."

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Staff user email")
        parser.add_argument(
            "--revoke",
            action="store_true",
            help="Revoke trial extension access instead of granting it.",
        )

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        revoke = options["revoke"]

        user = CustomUser.objects.filter(email__iexact=email).first()
        if not user:
            raise CommandError(f"User not found for email: {email}")

        if not user.is_staff:
            raise CommandError(f"User {email} is not staff.")

        restrictions, _ = CustomerServicePermissionRestrictions.objects.get_or_create(
            user=user
        )
        restrictions.can_extend_trial = not revoke
        restrictions.save(update_fields=["can_extend_trial", "updated_at"])

        if revoke:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Trial extension access revoked for staff user: {email}"
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Trial extension access granted for staff user: {email}"
            )
        )

