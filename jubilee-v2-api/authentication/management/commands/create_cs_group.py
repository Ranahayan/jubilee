from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = "Creates the Customer Service Group with filtered permissions"

    # Blocklist of permission codenames
    block_list = [
        "delete",
        "add_customuser",
        "logentry",
        "generation",
        "model",
        "group",
        "permission",
        "add_shop",
        "userreview",
        "usershopconnection" "token",
        "tokenproxy",
        "appsetting",
        "contenttype",
        "schedule",
        "periodic",
        "chordcounter",
        "groupresult",
        "taskresult",
        "notification",
        "modelpreset",
        "session",
        "customerservice"
    ]

    def handle(self, *args, **kwargs):
        group_name = "Customer Service Group"

        group, created = Group.objects.get_or_create(name=group_name)
        if not created:
            self.stdout.write(
                self.style.WARNING(f'The group "{group_name}" already exists.')
            )

        all_permissions = Permission.objects.all()

        # Filter permissions based on the blocklist
        filtered_permissions = [
            perm
            for perm in all_permissions
            if not any(blocked in perm.codename for blocked in self.block_list)
        ]

        group.permissions.set(filtered_permissions)
        self.stdout.write(
            self.style.SUCCESS(
                f'Group "{group_name}" created successfully with filtered permissions!'
            )
        )
