from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0038_remove_appsetting_paypal_product_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptionplan',
            name='for_winning',
            field=models.BooleanField(default=False),
        ),
    ]