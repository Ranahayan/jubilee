import csv
from django.core.management.base import BaseCommand
from dropshipping.models import Product, ProductVariant, Category, BrandType, ProductType, ProductAsset
from dropshipping.image_utils import download_image, optimize_image, create_thumbnail
from file.services import upload_file
import uuid
from tqdm import tqdm

def get_branding_type(branding_type):
    if branding_type == 'Brand Logo':
        return BrandType.BRAND_LOGO
    if branding_type == 'Brand Name':
        return BrandType.BRAND_NAME

    return BrandType.UNBRANDED

def get_image(image_url):
    image = download_image(image_url)

    if not image:
        return None, None

    optimized_image = optimize_image(image)
    thumbnail = create_thumbnail(optimized_image, (300, 300))
    file_name = f"{uuid.uuid4()}.png"
    optimized_image = upload_file(file_obj=optimized_image, file_name=file_name, user=None)
    thumbnail = upload_file(file_obj=thumbnail, file_name=f"thumbnail_{file_name}", user=None)

    return optimized_image, thumbnail
    
def get_cents(price):
    return float(price.replace("$", "")) * 100

class Command(BaseCommand):
    help = 'Import products from a local CSV file'

    def add_arguments(self, parser):
        parser.add_argument('filepath', type=str, help='The file path to the CSV')
        parser.add_argument('--supplier', type=int, help='The ID of the supplier')

    def handle(self, *args, **options):
        filepath = options['filepath']
        supplier_id = options['supplier']

        with open(filepath, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in tqdm(reader, desc='Importing products'):
                category = Category.objects.get(name=row['Categories'])
                branding_type = get_branding_type(row['Branding Type'])

                variant_image = None
                variant_image_thumb = None

                image_assets = []

                if row['Variant Image']:
                    variant_image, variant_image_thumb = get_image(row['Variant Image'])

                for img_column in ['Image2', 'Image3', 'Image4', 'Image5', 'Image6']:
                    if row[img_column]:
                        try:
                            image_assets.append(get_image(row[img_column]))
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error importing image: {row[img_column]}"))
                
                product = Product.objects.create(
                    title = row['Title'],
                    description = row['Body (HTML)'],
                    supplier_id = supplier_id,
                    category = category,
                    branding_type = branding_type,
                    is_premium = row['is_premium?'] == 'TRUE',
                )

                for image, thumbnail in image_assets:
                    ProductAsset.objects.create(
                        product = product,
                        image = image,
                        thumbnail = thumbnail,
                    )

                ProductVariant.objects.create(
                    product = product,
                    title = 'Standard',
                    sku = row['Variant SKU'],
                    image = variant_image,
                    thumbnail = variant_image_thumb,
                    inventory_quantity = int(row['Variant Inventory Qty']),
                    price_cents = get_cents(row['Variant Price']),
                    retail_price_cents = get_cents(row['Retail Price']),
                    product_type = ProductType.DROPSHIP_BRANDED if branding_type == BrandType.BRAND_NAME else ProductType.DROPSHIP_UNBRANDED,
                )

        self.stdout.write(self.style.SUCCESS('Successfully imported products.'))