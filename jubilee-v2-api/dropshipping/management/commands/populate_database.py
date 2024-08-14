import psycopg2
from psycopg2 import OperationalError
from django.core.management.base import BaseCommand
from authentication.models import CustomUser, Shop, SignupOrigin, PaymentProvider
from dropshipping.models import DropshipSettings, Supplier, Shipping, Address, Category, Product, BrandType, ProductVariant, ProductType, ProductAsset, ImportedProduct, ImportedVariant, Order, SubOrder, SubOrderStatus, OrderType, Customer, LineItem
from billing.models import SubscriptionPlan, Subscription, SubscriptionIntervals, ActiveStatus
from tqdm import tqdm
from file.services import upload_file
from urllib.parse import urlparse, unquote
from concurrent.futures import ThreadPoolExecutor, as_completed
from dropshipping.image_utils import create_thumbnail, optimize_image
from dropshipping.services import get_all_fulfillment_services, get_product_variants
from django.utils import timezone
from django.db.models import Count
import requests
import os
import time
import json
from django.conf import settings

def generate_file(image_url, generate_thumbnail=False):
    """
        Generate a file from the given image URL
    """
    path = urlparse(image_url).path
    file_name = unquote(path.split('/')[-1])

    response = requests.get(image_url)
    if response.status_code == 200:
        # Optimize the image
        optimized_image = optimize_image(response.content)
        file = upload_file(file_obj=optimized_image, file_name=file_name, user=None)
        thumbnail_file = None
        # Generate thumbnail if required
        if generate_thumbnail:
            thumbnail = create_thumbnail(optimized_image, (300, 300))
            thumbnail_file = upload_file(file_obj=thumbnail, file_name=f"thumbnail_{file_name}", user=None)
        return file, thumbnail_file
    else:
        return None, None
    
def format_image_url(cloudfront, prefix, sufix, id):
    """
        Format the image URL with the given prefix, sufix and id
    """
    infix = None
    id = str(id)

    if id.isnumeric():
        filled_id = id.zfill(9)
        infix = f"/{filled_id[0:3]}/{filled_id[3:6]}/{filled_id[6:9]}"
    else:
        infix = f"/{id[0:3]}/{id[3:6]}/{id[6:9]}"

    return cloudfront + prefix + infix + '/original/' + sufix

def get_branding_type(branding_type):
    """
        Get the branding type
    """
    if branding_type == 'Brand Logo':
        return BrandType.BRAND_LOGO
    elif branding_type == 'Brand Name':
        return BrandType.BRAND_NAME
    else:
        return BrandType.UNBRANDED

def get_product_type(product_type):
    """
        Get the product type
    """
    if product_type == 'dropship_branded':
        return ProductType.DROPSHIP_BRANDED
    elif product_type == 'wholesale':
        return ProductType.WHOLESALE
    else:
        return ProductType.DROPSHIP_UNBRANDED

def is_workers_valid(max_workers):
    max_supported = os.cpu_count() or 1
    return max_workers <= max_supported, max_supported

class Command(BaseCommand):
    help = 'Migrate all the Jubille data to the new database schema'

    def add_arguments(self, parser):
        parser.add_argument('connection_string', type=str, help='PostgreSQL connection string')

        parser.add_argument(
            '--max-workers',
            type=int,
            default=5,
            help='Set the maximum number of workers',
        )

        parser.add_argument(
            '--cloudfront-url',
            type=str,
            default=os.getenv('LEGACY_JUBILEE_CLOUDFRONT_URL'),
            help='Specify the CloudFront URL',
        )

    def populate_shops(self, cursor, users, users_by_domain, users_by_email):
        query = """
            SELECT s.shopify_token, s.shopify_domain, s.updated_at, s.id, s.shop_email, s.user_id, s.customer_id
            FROM shops s
        """
        shops = []
        users_to_create = []
        cursor.execute(query)
        rows = cursor.fetchall()

        for row in tqdm(rows, desc="Processing shops"):
            shopify_token, shopify_domain, shop_updated_at, shop_id, shop_email, user_id, customer_id= row

            try:
                # Create Shop instance if shop details exist
                if shopify_token and shopify_domain:
                    # Get shop owner by user id
                    shop_owner = users.get(user_id)

                    # Get shop owner by domain
                    if shop_owner is None:
                        shop_owner = users_by_domain.get(shop_email)
                    
                    # Get shop owner by email
                    if shop_owner is None:
                        shop_owner = users_by_email.get(shop_email)

                    # Create a new shop owner if not found
                    if shop_owner is None:
                        shop_owner = CustomUser(
                            email=shop_email,
                            name="Jubilee User: {}".format(shop_email),
                            legacy_id=user_id,
                            stripe_customer_id=customer_id,
                            signup_origin=SignupOrigin.DIRECT,
                            payment_provider=PaymentProvider.STRIPE
                        )
                        users_to_create.append(shop_owner)
                        users_by_email[shop_email] = shop_owner

                    shop_instance = Shop(
                        shopify_access_token=shopify_token,
                        url=shopify_domain,
                        legacy_id=shop_id,
                        owner=shop_owner,
                        last_updated_at=shop_updated_at
                    )

                    shops.append(shop_instance)
            except Exception as e:
                self.stdout.write(self.style.ERROR('Error occurred while collecting data for shop: {}'.format(e)))
                continue

        # Bulk create CustomUser instances
        CustomUser.objects.bulk_create(users_to_create)
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(users_to_create)} users'))
        # Bulk create Shop instances
        Shop.objects.bulk_create(shops)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(shops)} shops'))
        return {shop.legacy_id: shop for shop in shops}

    def populate_users(self, cursor):
        query = """
            SELECT u.id, u.email, u.name, u.shop_domain, u.customer_id, u.direct_signup, u.payment_gateway, u.created_at
            FROM users u;
        """

        custom_users = []
        users_by_domain = {}
        users_by_email = {}

        cursor.execute(query)
        rows = cursor.fetchall()

        for row in tqdm(rows, desc="Processing users"):
            user_id, email, name, shop_domain, customer_id, direct_signup, payment_gateway, created_at = row
            try:
                # Create CustomUser instance
                custom_user = CustomUser(
                    email=email,
                    name=name[:100],
                    legacy_id=user_id,
                    stripe_customer_id=customer_id,
                    signup_origin=SignupOrigin.DIRECT if direct_signup else SignupOrigin.SHOPIFY,
                    payment_provider=payment_gateway,
                    created_at=timezone.make_aware(created_at)
                )
                users_by_domain[shop_domain] = custom_user
                users_by_email[email] = custom_user
                custom_users.append(custom_user)      
            except Exception as e:
                self.stdout.write(self.style.ERROR('Error occurred while collecting data for user: {}'.format(e)))
                continue

        # Bulk create CustomUser instances
        CustomUser.objects.bulk_create(custom_users)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(custom_users)} users'))
        return {user.legacy_id: user for user in custom_users}, users_by_domain, users_by_email

    def populate_dropship_settings(self, cursor, shops):
        query = """
            SELECT sh.id AS shop_id, s.brand_name, s.store_name, s.email, s.notes, s.preferred_background_color,
            s.preferred_font, s.website_url, s.logo_file_name, s.last_4, s.payments_source, s.id AS settings_id
            FROM settings s
            LEFT JOIN shops sh ON s.user_id = sh.user_id OR s.shop_id = sh.id
        """

        dropshipping_settings = []
        user_payment_info = []
        shops_to_update = []
        cursor.execute(query)
        rows = cursor.fetchall()
        shops_cache = {}

        try:
            file_path = os.path.join(settings.BASE_DIR, 'shops.json')
            with open(file_path, 'r') as shop_json:
                data = json.load(shop_json)["shops"]
                shops_cache = {shop["legacy_id"]: shop for shop in data}
                self.stdout.write(self.style.SUCCESS(f'Successfully loaded {len(shops_cache)} shops cache'))
        except Exception as e:
            self.stdout.write(self.style.WARNING('Could not load shops cache'))

        def process_row(row):
            shop_id, brand_name, store_name, email, notes, preferred_background_color, preferred_font, website_url, logo_file_name, last_4, payments_source, settings_id = row
            shop = shops.get(shop_id, None)
            location_id = None

            if not shop:
                return None, None
            
            shop_cache = shops_cache.get(str(shop_id), None)
            if not shop_cache:
                try:
                    shopify_domain, fulfillment_services = get_all_fulfillment_services(shop)
                    shop_name = shopify_domain.split('.')[0].split('-')[0].lower()

                    for fs in fulfillment_services:
                        short_name = fs['serviceName'].split('-')[0].lower()
                        if short_name == shop_name:
                            location_id = fs["location"]["id"]
                            break
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error occurred while collecting data for fulfillment services: {shop.url}'))
                    shop.is_active = False
                    shops_to_update.append(shop)
            else:
                # Get location id from shop cache
                location_id = shop_cache.get('shopify_location_id', None)
                is_active = shop_cache.get('is_active', True)

                if not is_active:
                    shop.is_active = False
                    shops_to_update.append(shop)

            try:
                branded_logo = None

                if logo_file_name:
                    image_url = format_image_url(self.LEGACY_JUBILEE_CLOUDFRONT_URL, '/settings/logos', logo_file_name, settings_id)
                    branded_logo, _ = generate_file(image_url)

                dropship_setting = DropshipSettings(
                    shop=shop,
                    brand_name=brand_name,
                    brand_logo=branded_logo,
                    invoice_logo=branded_logo,
                    font_family=preferred_font,
                    products_background_color=preferred_background_color,
                    invoice_store_name=store_name,
                    invoice_contact_email=email,
                    invoice_website=website_url[:512] if website_url else None,
                    invoice_body=notes,
                    shopify_location_id=location_id
                )

                user_payment_info = None
                if payments_source:
                    user_payment_info = shop.owner
                    user_payment_info.stripe_card_digits = last_4
                    user_payment_info.stripe_payment_method_id = payments_source

                return dropship_setting, user_payment_info
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error occurred while collecting data for dropshipping settings: {e}'))
                return None, None

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(process_row, row) for row in rows]
            for future in tqdm(as_completed(futures), total=len(rows), desc="Processing Dropshipping Settings"):
                setting, user_info = future.result()
                if setting:
                    dropshipping_settings.append(setting)
                if user_info:
                    user_payment_info.append(user_info)
        
        batch_size = 20000
        # Bulk create DropshipSettings instances
        for start in tqdm(range(0, len(dropshipping_settings), batch_size), desc="Running the bulk create"):
            end = start + batch_size
            batch = dropshipping_settings[start:end]
            self.stdout.write(self.style.WARNING(f'Creating batch {start} to {end}'))
            DropshipSettings.objects.bulk_create(batch)

        # Update user payment info
        self.stdout.write(self.style.WARNING('Updating user payment info'))
        CustomUser.objects.bulk_update(user_payment_info, ['stripe_card_digits', 'stripe_payment_method_id'])
        # Update shops
        self.stdout.write(self.style.WARNING('Updating shops'))
                
        for start in tqdm(range(0, len(shops_to_update), 1000), desc="Running the bulk update"):
            end = start + 1000
            batch = shops_to_update[start:end]
            Shop.objects.bulk_update(batch, ['is_active'])

        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(dropshipping_settings)} dropshipping settings'))
        self.stdout.write(self.style.SUCCESS(f'Disabled {len(shops_to_update)} shops with invalid access tokens'))
        # Create a map of shop id to dropshipping settings instance
        return {setting.shop_id: setting for setting in dropshipping_settings}

    def populate_plans(self, cursor):
        query = """
            SELECT p.name, p.annual, p.price_cents, p.trial_days, p.limits, p.features, p.visible, sp.uid AS stripe_plan_id
            FROM plans p
            LEFT JOIN stripe_plans sp ON sp.plan_id = p.id
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        plans = []

        for row in tqdm(rows, desc="Processing plans"):
            name, annual, price_cents, trial_days, limits, features, visible, stripe_plan_id = row

            limits = {
                'live_products': limits['unique_products'] if not limits['unique_products'] == 'unlimited' else 1000000,
                'premium_products': limits['premium_products'] if not limits['premium_products'] == 'unlimited' else 1000000,
                'branded_invoice': limits['branded_invoicing'],
                'personalized_branding': limits['personalized_branding'],
                'customized_product_image_background': limits['customized_product_image_background']
            }

            if name == 'Basic':
                continue

            months_off = 0

            if annual:
                price_cents = price_cents / 12

            new_plan = SubscriptionPlan(
                interval=SubscriptionIntervals.YEARLY if annual else SubscriptionIntervals.MONTHLY,
                cost_per_month=price_cents,
                trial_days=trial_days,
                features=features,
                limits=limits,
                name=name,
                months_off=months_off,
                stripe_plan_id=stripe_plan_id,
                status=ActiveStatus.ACTIVE if visible else ActiveStatus.INACTIVE
            )

            plans.append(new_plan)

        monthly_plans = [plan for plan in plans if plan.interval == SubscriptionIntervals.MONTHLY]
        monthly_plans = {plan.name: plan for plan in monthly_plans}

        # Update the months off for the plans
        for plan in plans:
            if plan.interval == SubscriptionIntervals.YEARLY:
                plan_name = 'Pro Monthly' if plan.name == 'Pro Annual' else plan.name
                monthly_plan = monthly_plans.get(plan_name)
                if not monthly_plan:
                    continue
                monthly_price = monthly_plan.cost_per_month
                annual_price = plan.cost_per_month * 12
                plan.months_off = round(((monthly_price * 12) - annual_price) / monthly_price)

        # Bulk create SubscriptionPlan instances
        SubscriptionPlan.objects.bulk_create(plans)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(plans)} plans'))

    def populate_subscriptions(self, cursor, shops):
        query = """
            SELECT s.id AS legacy_id, s.status, s.current_subscription, s.price_id, sh.id AS shop_id, u.payment_gateway, s.user_id
            FROM subscriptions s
            LEFT JOIN shops sh ON s.user_id = sh.user_id OR S.shop_id = sh.id
            LEFT JOIN users u ON s.user_id = u.id or sh.user_id = u.id;
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        subscriptions = []
        plans = {plan.stripe_plan_id: plan for plan in SubscriptionPlan.objects.all()}
        shops_by_owner = {shop.owner.legacy_id: shop for shop in Shop.objects.all().select_related('owner')}

        for row in tqdm(rows, desc="Processing subscriptions"):
            legacy_id, status, current_subscription, price_id, shop_id, payment_gateway, user_id = row

            plan = plans.get(price_id, None)
            shop = shops.get(shop_id, None)

            if not shop and user_id is not None:
                shop = shops_by_owner.get(user_id, None)

            if not shop or not plan:
                if status == 'unpaid' or status == 'canceled' or status == 'pending':
                    continue
                if not shop:
                    self.stdout.write(self.style.ERROR(f'Shop with id {shop_id} does not exist for subscription {legacy_id}'))
                if not plan:
                    self.stdout.write(self.style.ERROR(f'Plan with id {price_id} does not exist for subscription {legacy_id}'))
                continue

            new_subscription = Subscription(
                shop_id=shop.id,
                plan=plan,
                external_id=current_subscription,
                status=ActiveStatus.ACTIVE if status == 'active' or status == 'trialing' else ActiveStatus.INACTIVE,
                payment_provider=PaymentProvider.STRIPE if payment_gateway == 'stripe' else PaymentProvider.SHOPIFY,
                legacy_id=legacy_id
            )

            subscriptions.append(new_subscription)

        # Bulk create Subscription instances
        Subscription.objects.bulk_create(subscriptions)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(subscriptions)} subscriptions of total {len(rows)}'))

    def populate_suppliers(self, cursor):
        query = """
            SELECT s.id, s.name, s.email, s.bank_account, se.defaults, se.processing_time
            FROM suppliers s
            LEFT JOIN supplier.settings se ON se.supplier_id = s.id;
        """
        suppliers = []
        cursor.execute(query)
        rows = cursor.fetchall()

        for row in tqdm(rows, desc="Processing Suppliers"):
            legacy_id, name, email, bank_account, defaults, processing_time= row

            domestic_shipping = defaults.get('default_domestic_shipping')
            base_price_cents = domestic_shipping.get('base_price_cents')
            incremental_price_cents = domestic_shipping.get('incremental_price_cents')
            delivery_time = domestic_shipping.get('delivery_time')

            try:
                shipping = Shipping.objects.create(
                    base_price_cents= base_price_cents,
                    incremental_price_cents= incremental_price_cents,
                    delivery_time= delivery_time,
                    processing_time= processing_time
                )
                            
                address = Address.objects.create(country= 'United States')

                suppliers.append(Supplier(
                    name=name,
                    legacy_id=legacy_id,
                    email=email,
                    bank_account=bank_account,
                    address=address,
                    shipping=shipping
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR('Error occurred while collecting data for supplier: {}'.format(e)))
                continue
        
        # Bulk create Supplier instances
        Supplier.objects.bulk_create(suppliers)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(suppliers)} suppliers'))
        return {supplier.legacy_id: supplier for supplier in suppliers}

    def populate_categories(self, cursor):
        query = """
            SELECT c.id AS legacy_id, c.name, c.attachment_file_name, c.is_active
            FROM listing.categories c;
        """
        categories = []
        cursor.execute(query)
        rows = cursor.fetchall()

        def process_row(row):
            legacy_id, name, file_name, is_active = row
            try:
                image, _ = generate_file(format_image_url(self.LEGACY_JUBILEE_CLOUDFRONT_URL, '/listings/categories/attachments', file_name, legacy_id))
                return Category(
                    name=name,
                    legacy_id=legacy_id,
                    is_active=is_active,
                    image=image
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error occurred while collecting data for categories: {e}'))
                return None

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(process_row, row) for row in rows]
            for future in tqdm(as_completed(futures), total=len(rows), desc="Processing Categories"):
                category = future.result()
                if category:
                    categories.append(category)
        
        # Bulk create categories instances
        Category.objects.bulk_create(categories)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(categories)} categories'))
        # Create a map of category id to category instance
        return {category.legacy_id: category for category in categories}

    def populate_products(self, cursor, suppliers, categories):
        query = """
            SELECT p.id AS legacy_id, p.supplier_id, p.listing_category_id, p.title, p.description, p.tags, p.moq, 
            p.is_premium, p.branding_type, p.is_active
            FROM supplier.listings p;
        """
        products = []
        cursor.execute(query)
        rows = cursor.fetchall()

        for row in tqdm(rows, desc="Processing Products"):
            legacy_id, supplier_id, category_id, title, description, tags, moq, is_premium, branding_type, is_active = row

            try:
                products.append(Product(
                    title=title,
                    description=description,
                    supplier=suppliers.get(supplier_id),
                    category=categories.get(category_id),
                    tags=tags,
                    moq_quantity=5 if moq else 0, # Default to 5 if moq is true
                    branding_type=get_branding_type(branding_type),
                    is_premium=is_premium,
                    is_active=is_active,
                    legacy_id=legacy_id,
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR('Error occurred while collecting data for products: {}'.format(e)))
                continue
        
        # Bulk create products instances
        Product.objects.bulk_create(products)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(products)} products'))
        return {product.legacy_id: product for product in products}

    def populate_variants(self, cursor, products):
        query = """
            SELECT v.id AS legacy_id, v.listing_id, v.inventory, v.sku, v.price_cents,
            v.retail_price_cents, v.product_type, v.is_active
            FROM supplier.listing_variations v;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        variants = []
        products_to_update = []

        for row in tqdm(rows, desc="Processing Variants"):
            legacy_id, product_id, inventory, sku, price_cents, retail_price_cents, product_type, is_active = row

            try:
                product = products.get(product_id)

                if not product:
                    self.stdout.write(self.style.ERROR(f'Product with id {product_id} does not exist for variant {legacy_id}'))
                    continue
                
                # A specific list for an edge case, a consequence of the hardcoded values present in the legacy database
                logo_type_products = [
                    "Edge Control Protein",
                    "Stimulating Conditioner 8oz",
                    "Stimulating Shampoo 8oz",
                    "Growth Stimulating Oil Blend 2oz",
                    "Mens Growth Oil",
                    "Growth Oil 4oz"
                ]
                
                product_type = get_product_type(product_type)
                if product_type is ProductType.DROPSHIP_BRANDED and product.branding_type is BrandType.UNBRANDED:
                    if product.title in logo_type_products:
                        product.branding_type = BrandType.BRAND_LOGO
                    else:
                        product.branding_type = BrandType.BRAND_NAME

                    products_to_update.append(product)

                variants.append(ProductVariant(
                    product=product,
                    title="Standard",
                    sku=sku,
                    inventory_quantity=inventory,
                    price_cents=price_cents,
                    retail_price_cents=retail_price_cents,
                    product_type=product_type,
                    is_active=is_active,
                    legacy_id=legacy_id
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR('Error occurred while collecting data for variants: {}'.format(e)))
                continue
        
        # Bulk create variants instances
        ProductVariant.objects.bulk_create(variants)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(variants)} variants'))
        # Disable variants with product with more than one variant
        products_with_multiple_variants = Product.objects.annotate(variants_count=Count('variants')).filter(variants_count__gt=1)
        variants_to_update = []

        for product in products_with_multiple_variants:
            if product.moq_quantity > 1 and product.variants.filter(product_type=ProductType.WHOLESALE).exists():
                for variant in product.variants.all():
                    if variant.product_type is not ProductType.WHOLESALE:
                        variant.is_active = False
                        variants_to_update.append(variant)
                        self.stdout.write(self.style.WARNING(f'Disabled variant {variant.legacy_id} for product {product.legacy_id}'))
            else:
               for index, variant in enumerate(product.variants.all()):
                    if index > 0:
                        variant.is_active = False
                        variants_to_update.append(variant)
                        self.stdout.write(self.style.WARNING(f'Disabled variant {variant.legacy_id} for product {product.legacy_id}'))

        ProductVariant.objects.bulk_update(variants_to_update, ['is_active'])
        # 
        Product.objects.bulk_update(products_to_update, ['branding_type'])
        # Create a map of variant id to variant instance
        return {variant.legacy_id: variant for variant in variants}

    def populate_product_assets(self, cursor, products, variants):
        query = """
            SELECT i.id AS legacy_id, i.listing_id, i.attachment_file_name, i.listing_variation_id
            FROM listing_variation_images i WHERE i.primary_image = true;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        product_assets = []
        variants_to_update = []

        def download_and_process_image(row, products, variants):
            legacy_id, product_id, file_name, variant_id = row
            product_assets = []
            variants_to_update = []

            try:
                product = products.get(product_id)
                variant = variants.get(variant_id)
                # Skip if product does not exist
                if not product or (variant_id and not variant):
                    return [], []

                image_url = format_image_url(self.LEGACY_JUBILEE_CLOUDFRONT_URL, '/listing_variation_images/attachments', file_name, legacy_id)
                image, thumbnail = generate_file(image_url, generate_thumbnail=True)

                if variant_id:
                    variant.image = image
                    variant.thumbnail = thumbnail
                    variants_to_update.append(variant)
                else:
                    product_assets.append(ProductAsset(
                        product=product,
                        image=image,
                        thumbnail=thumbnail,
                    ))
            except Exception as e:
                print(f'Error occurred while collecting data for product assets: {e}')
            return product_assets, variants_to_update

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(download_and_process_image, row, products, variants) for row in rows]
            for future in tqdm(as_completed(futures), total=len(rows), desc="Processing Product Assets"):
                assets, variants = future.result()
                product_assets.extend(assets)
                variants_to_update.extend(variants)
        
        # Bulk create product assets instances
        ProductAsset.objects.bulk_create(product_assets)
        # Update variants with images
        ProductVariant.objects.bulk_update(variants_to_update, ['image', 'thumbnail'])
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(product_assets)} product assets'))

    def populate_imported_products(self, cursor, shops, products, variants, dropship_settings):
        query = """
            SELECT p.id AS legacy_id, s.id AS shop_id, p.listing_id, p.is_pushed, p.shopify_product_id, 
            p.preferred_background_color, p.cost_cents, p.description, p.variation_id, p.created_at 
            FROM dropshippers_listing_customizations p 
            LEFT JOIN shops s ON p.user_id = s.user_id or p.shop_id = s.id;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        imported_products = []
        imported_variants_data = []
        variants_cache = {}

        try:
            file_path = os.path.join(settings.BASE_DIR, 'variants.json')
            with open(file_path, 'r') as variants_json:
                data = json.load(variants_json)["variants"]
                variants_cache = {variant["legacy_id"]: variant for variant in data}
        except Exception as e:
            self.stdout.write(self.style.WARNING('Could not load variants cache'))

        def process_row(row, shops, products, variants, dropship_settings):
            legacy_id, shop_id, product_id, is_pushed, shopify_product_id, bg_color, cost_cents, description, variation_id, created_at = row
            shop = shops.get(shop_id)
            product = products.get(product_id)
            variant = variants.get(variation_id)
            imported_product = None

            if not shop or not product or not variant:
                return None, None
            
            shopify_product_link = None
            shopify_variant_id = None
            shopify_inventory_item_id = None
            shopify_inventory_level_id = None

            if shopify_product_id:
                shop_name = shop.url.split('.')[0]
                shopify_product_link = f"https://admin.shopify.com/store/{shop_name}/products/{shopify_product_id}"

                try:
                    if shop.is_active:
                        variant_cache = variants_cache.get(str(legacy_id), None)
                        # Get shopify variant id from cache
                        if variant_cache and variant_cache.get('shopify_variant_id'):
                            shopify_variant_id = variant_cache.get('shopify_variant_id')
                        else:
                            # Get shopify variant id from shopify
                            location_id = dropship_settings.get(shop.id).shopify_location_id
                            shopify_variants = get_product_variants(shop, f"gid://shopify/Product/{shopify_product_id}", location_id)
                            shopify_variant_id = shopify_variants[0].get('id')
                            shopify_inventory_item_id = shopify_variants[0].get('inventory_item_id')
                            shopify_inventory_level_id = shopify_variants[0].get('inventory_item_id')
                except Exception as e:
                    pass
            
            imported_product = ImportedProduct(
                legacy_id=legacy_id,
                shop=shop,
                product=product,
                description=description,
                is_live=is_pushed,
                background_color=bg_color,
                shopify_product_id=f"gid://shopify/Product/{shopify_product_id}" if shopify_product_id else None,
                shopify_product_link=shopify_product_link,
                created_at=timezone.make_aware(created_at)
            )

            i_variant_to_create = {
                "variant": variant,
                "retail_price_cents": cost_cents,
                "legacy_id": legacy_id,
                "shopify_variant_id": shopify_variant_id,
                "shopify_inventory_item_id": shopify_inventory_item_id,
                "shopify_inventory_level_id": shopify_inventory_level_id
            }

            return imported_product, i_variant_to_create

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            futures = [executor.submit(process_row, row, shops, products, variants, dropship_settings) for row in rows]
            for future in tqdm(as_completed(futures), total=len(rows), desc="Processing Imported Products"):
                imported_product, i_variant_to_create = future.result()
                if imported_product and i_variant_to_create:
                    imported_products.append(imported_product)
                    imported_variants_data.append(i_variant_to_create)
        
        # Bulk create imported products instances
        batch_size = 20000
        # Bulk create DropshipSettings instances
        for start in range(0, len(imported_products), batch_size):
            end = start + batch_size
            batch = imported_products[start:end]
            ImportedProduct.objects.bulk_create(batch)

        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(imported_products)} imported products'))

        imported_products_dic = {i_product.legacy_id: i_product for i_product in imported_products}
        imported_variants = []
        for variant in imported_variants_data:
            variant["imported_product"] = imported_products_dic.get(variant["legacy_id"])
            del variant["legacy_id"]
            imported_variants.append(ImportedVariant(**variant))

        # Bulk create imported variants instances
        for start in range(0, len(imported_variants), batch_size):
            end = start + batch_size
            batch = imported_variants[start:end]
            ImportedVariant.objects.bulk_create(batch)

        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(imported_products)} imported variants'))

    def populate_orders(self, cursor, shops):
        query = """
            SELECT o.id AS legacy_id, o.shop_id, o.order_number, o.order_type, o.customer, o.shipping_address, sr.webhook_request, o.created_at
            FROM orders o
            LEFT JOIN shopify_requests sr ON o.shopify_request_id = sr.id
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        orders = []

        for row in tqdm(rows, desc="Processing Orders"):
            legacy_id, shop_id, order_number, order_type, customer_data, shipping_address_data, webhook_data, created_at = row
            shop = shops.get(shop_id)

            if not shop:
                continue

            customer = None
            shipping_address = None
            shopify_order_id = None

            if customer_data:
                first_name = customer_data.get('first_name')
                last_name = customer_data.get('last_name')

                if first_name and last_name:
                    customer = Customer.objects.create(
                        first_name=customer_data.get('first_name'),
                        last_name=customer_data.get('last_name')
                    )

            if shipping_address_data:
                shipping_address = Address.objects.create(
                    line_1=shipping_address_data.get('address1'),
                    line_2=shipping_address_data.get('address2'),
                    city=shipping_address_data.get('city'),
                    country=shipping_address_data.get('country'),
                    state=shipping_address_data.get('province'),
                    zip=shipping_address_data.get('zip'),
                    phone=shipping_address_data.get('phone')
                )

            if webhook_data:
                shopify_order_id = webhook_data.get('admin_graphql_api_id')

            orders.append(Order(
                shop=shop,
                customer=customer,
                shipping_address=shipping_address,
                shopify_order_id=shopify_order_id,
                shopify_order_name=order_number,
                order_type=OrderType.SHOPIFY if order_type == 'shopify' else OrderType.SAMPLE_ORDER,
                legacy_id=legacy_id,
                created_at=timezone.make_aware(created_at)
            ))
        
        # Bulk create orders instances
        Order.objects.bulk_create(orders)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(orders)} orders'))
        return {order.legacy_id: order for order in orders}

    def populate_sub_orders(self, cursor, orders, suppliers):
        query = """
            SELECT so.id AS legacy_id, so.order_id, so.total_cost, so.shipping_cost, so.status, so.tracking_carrier, so.tracking_number, so.tracking_link, so.supplier_id, so.checkout_at, so.created_at 
            FROM sub_orders so;
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        sub_orders = []
        sub_orders_to_update = []

        for row in tqdm(rows, desc="Processing Sub Orders"):
            legacy_id, order_id, total_cost, shipping_cost, status, tracking_carrier, tracking_number, tracking_link, supplier_id, checkout_at, created_at = row
            order = orders.get(order_id)
            supplier = suppliers.get(supplier_id)

            if not order or not supplier:
                if not order:
                    self.stdout.write(self.style.ERROR(f'Order with id {order_id} does not exist for sub order {legacy_id}'))
                
                if not supplier:
                    self.stdout.write(self.style.ERROR(f'Supplier with id {supplier_id} does not exist for sub order {legacy_id}'))
                continue
            
            sub_order = SubOrder(
                shop=order.shop,
                order=order,
                supplier=supplier,
                total_cost_cents=(total_cost or 0) * 100,
                shipping_cost_cents=(shipping_cost or 0) * 100,
                status=SubOrderStatus.PAID if status == 'paid' else SubOrderStatus.UNPAID,
                checkout_at=timezone.make_aware(checkout_at) if checkout_at else None,
                tracking_carrier=tracking_carrier,
                tracking_number=tracking_number,
                tracking_link=tracking_link,
                created_at=timezone.make_aware(created_at),
                legacy_id=legacy_id
            )

            sub_orders.append(sub_order)

            if total_cost is None or shipping_cost is None:
                sub_orders_to_update.append(sub_order)
        
        # Bulk create sub orders instances
        SubOrder.objects.bulk_create(sub_orders)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(sub_orders)} sub orders'))
        return {str(sub_order.legacy_id): sub_order for sub_order in sub_orders}, sub_orders_to_update

    def populate_line_items(self, cursor, sub_orders, products, variants):
        query = """
            SELECT li.id AS legacy_id, li.sub_order_id, li.title, li.cost_cents, li.total_shipping, li.quantity, 
            li.shopify_product_id, li.total_cost, li.listing_id, li.variation_id, li.total_shopify_cost
            FROM line_items li;
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        line_items = []

        for row in tqdm(rows, desc="Processing Line Items"):
            legacy_id, sub_order_id, title, cost_cents, total_shipping, quantity, shopify_product_id, total_cost, product_id, variant_id, total_shopify_cost = row
            sub_order = sub_orders.get(sub_order_id)
            product = products.get(product_id)
            variant = variants.get(variant_id)

            if not sub_order:
                continue

            total_cost = total_cost or 0

            shopify_product_id = f"gid://shopify/Product/{shopify_product_id}" if shopify_product_id else None

            line_items.append(LineItem(
                sub_order=sub_order,
                product=product,
                variant=variant,
                title=title,
                quantity=quantity,
                sku=variant.sku if variant else legacy_id,
                cost_cents=cost_cents * 100 if cost_cents else total_cost / quantity,
                total_cost_cents=total_cost * 100,
                total_shipping_cost_cents=total_shipping * 100,
                shopify_product_id=shopify_product_id,
                shopify_price_cents=(total_shopify_cost or 0) * 100,
                legacy_id=legacy_id
            ))
        
        # Bulk create line items instances
        LineItem.objects.bulk_create(line_items)
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {len(line_items)} line items'))

    def update_sub_orders(self, sub_orders):
        for sub_order in sub_orders:
            sub_order.update_costs()

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {len(sub_orders)} sub orders'))

    def handle(self, *args, **options):
        connection_string = options['connection_string']
        self.MAX_WORKERS = options['max_workers']
        self.LEGACY_JUBILEE_CLOUDFRONT_URL = options['cloudfront_url']

        is_supported, max_workers = is_workers_valid(self.MAX_WORKERS)

        if not is_supported:
            self.stdout.write(self.style.ERROR('Invalid number of workers. Please provide a valid number of workers'))
            self.stdout.write(self.style.WARNING(f'Maximum number of workers supported is {max_workers}'))
            return

        try:
            # Connect to PostgreSQL
            connection = psycopg2.connect(connection_string)
            cursor = connection.cursor()
            start_time = time.time()
            # Populate the database
            users, users_by_domain, users_by_email = self.populate_users(cursor)
            shops = self.populate_shops(cursor, users, users_by_domain, users_by_email)
            dropship_settings = self.populate_dropship_settings(cursor, shops)
            self.populate_plans(cursor)
            self.populate_subscriptions(cursor, shops)
            suppliers = self.populate_suppliers(cursor)
            categories = self.populate_categories(cursor)
            products = self.populate_products(cursor, suppliers, categories)
            variants = self.populate_variants(cursor, products)
            self.populate_product_assets(cursor, products, variants)
            self.populate_imported_products(cursor, shops, products, variants, dropship_settings)
            orders = self.populate_orders(cursor, shops)
            sub_orders, sub_orders_to_update = self.populate_sub_orders(cursor, orders, suppliers)
            self.populate_line_items(cursor, sub_orders, products, variants)
            self.update_sub_orders(sub_orders_to_update)
            end_time = time.time()
            duration = end_time - start_time
            self.stdout.write(self.style.SUCCESS(f'Time taken to migrate all the data: {duration / 60} minutes'))
            self.stdout.write(self.style.SUCCESS(f'Successfully migrated all the data'))
            # Close the cursor and connection
            cursor.close()
            connection.close()

        except OperationalError as e:
            self.stdout.write(self.style.ERROR('Operational Error occurred while connecting to the database: {}'.format(e)))
