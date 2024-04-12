from django.core.management.base import BaseCommand
from authentication.models import Shop
from shopify_integration.services import get_shopify_webhooks, delete_shopify_webhook, create_webhooks
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from tqdm import tqdm

class Command(BaseCommand):
    help = 'Resets all webhooks on the shopify store for all users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-delete',
            action='store_true',
            help='Skip deleting existing webhooks',
        )

        parser.add_argument(
            '--skip-create',
            action='store_true',
            help='Skip creating new webhooks',
        )

        parser.add_argument(
            '--max-workers',
            type=int,
            default=5,
            help='Set the maximum number of workers',
        )

    def handle(self, *args, **options):
        skip_delete = options['skip_delete']
        skip_create = options['skip_create']
        max_workers = options['max_workers']

        shops = Shop.objects.filter(is_active=True).all()

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for shop in shops:
                future = executor.submit(self.process_shop, shop, skip_delete, skip_create)
                futures.append(future)

            for future in tqdm(futures, desc='Processing shops'):
                future.result()

        self.stdout.write(self.style.SUCCESS('Successfully reset webhooks for all shops'))

    def process_shop(self, shop, skip_delete, skip_create):
        # Delete existing webhooks
        if not skip_delete:
            subscriptions = get_shopify_webhooks(shop)
            for subscription in subscriptions:
                if not subscription["endpoint"]["callbackUrl"].startswith(settings.API_URL):
                    delete_shopify_webhook(shop, subscription["id"])

        # Create new webhooks
        if not skip_create:
            try:
              create_webhooks(shop)
            except Exception as e:
              return None
