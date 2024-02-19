from django.db import migrations
from django.core.management import call_command

def run_create_cs_group(apps, schema_editor):
    call_command('create_cs_group')

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0017_customerservicepermissionrestrictions_and_more'),
    ]

    operations = [
        migrations.RunPython(run_create_cs_group),
    ]
