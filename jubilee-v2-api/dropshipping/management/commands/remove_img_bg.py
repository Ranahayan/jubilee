import time
from django.core.management.base import BaseCommand
from dropshipping.models import ProductVariant, ProductAsset
from dropshipping.image_utils import remove_image_background, download_image
from file.models import File
from file.services import upload_file
import uuid
from tqdm import tqdm
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed

MAX_WORKERS = 6

def upload(image):
    """
    Upload the given image to the file storage
    """
    file_name = f'{uuid.uuid4()}.png'
    file = upload_file(file_obj=image.getvalue(), file_name=file_name, user=None)
    return file

def get_img_bytes(image):
    image_bytes = BytesIO()
    image.save(image_bytes, format='PNG')
    image_bytes.seek(0)
    return image_bytes

def remove_bg_from_file(image_file: File):
    """
    Remove the background from the given image file
    """
    bg_img_file = File.objects.get(pk=image_file.id)
    image = download_image(bg_img_file.url)
    image = remove_image_background(image)

    image_bytes = get_img_bytes(image)
    image.thumbnail((300, 300), Image.Resampling.LANCZOS)
    thumbnail_bytes = get_img_bytes(image)
    
    image_file = upload(image_bytes)
    thumbnail_file = upload(thumbnail_bytes)

    return image_file, thumbnail_file

class Command(BaseCommand):
    help = 'Remove the background from all images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--products',
            type=str,
            help='The product IDs to process (comma-separated)',
        )
    
    def handle(self, *args, **kwargs):
        products_ids = kwargs.get('products', '').split(',')

        variants = ProductVariant.objects.filter(image__isnull=False, product__id__in=products_ids)
        # This print is import to force the Django to pre connect to the aws
        print(variants[0].image.url)
        # Take a break to avoid the connection crenetials error
        time.sleep(3)

        def process_variant(variant):
            try:
                image_file, thumbnail_file = remove_bg_from_file(variant.image)
                variant.image = image_file
                variant.thumbnail = thumbnail_file
                variant.save()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to remove background from image {variant.id}: {e}'))

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(process_variant, variant) for variant in variants]
            for future in tqdm(as_completed(futures), total=len(variants), desc="Removing background from images (variants)"):
                future.result()

        product_assets = ProductAsset.objects.filter(image__isnull=False, product__id__in=products_ids)

        def process_asset(asset):
            try:
                image_file, thumbnail_file = remove_bg_from_file(asset.image)
                asset.image = image_file
                asset.thumbnail = thumbnail_file
                asset.save()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to remove background from image {asset.id}: {e}'))

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(process_asset, asset) for asset in product_assets]
            for future in tqdm(as_completed(futures), total=len(product_assets), desc="Removing background from images (assets)"):
                future.result()

        self.stdout.write(self.style.SUCCESS('Successfully removed background from all images'))
