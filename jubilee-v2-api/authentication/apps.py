from django.apps import AppConfig
from django.conf import settings


class AccountConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    label = 'authentication'

    def ready(self):
        import authentication.signals
