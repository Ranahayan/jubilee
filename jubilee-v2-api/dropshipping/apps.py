from django.apps import AppConfig


class DropshippingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dropshipping'

    def ready(self):
        import dropshipping.signals
