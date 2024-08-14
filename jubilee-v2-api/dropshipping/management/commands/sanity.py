from django.core.management.base import BaseCommand
import psycopg2
from psycopg2 import OperationalError
from django.core.management.base import BaseCommand
from tqdm import tqdm
from authentication.models import CustomUser, Shop
from billing.models import ActiveStatus, Subscription, SubscriptionPlan
from dropshipping.models import ImportedProduct, OrderType, Product, ImportedVariant, Order, SubOrder, SubOrderStatus, Supplier, LineItem

class Command(BaseCommand):
    help = 'Run sanity checks with the migrated data'

    def add_arguments(self, parser):
        parser.add_argument('connection_string', type=str, help='PostgreSQL connection string')

    def check_users(self, cursor):
        query = """
            SELECT u.id, u.email, u.name, u.customer_id, u.payment_gateway
            FROM users u;
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        
        users = CustomUser.objects.all()
        users = {user.legacy_id: user for user in users}
        count = 0

        for row in tqdm(rows, desc='Checking users'):
            user_id, email, name, customer_id, payment_gateway = row
            user = users.get(user_id)

            if user is None:
                self.stdout.write(self.style.ERROR('User with id {} not found'.format(user_id)))
                continue

            if user.email != email:
                self.stdout.write(self.style.ERROR('Email mismatch for user with id {}'.format(user_id)))
                continue
            
            if user.name != name[:100]:
                self.stdout.write(self.style.ERROR('Name mismatch for user with id {}'.format(user_id)))
                continue
            
            if user.stripe_customer_id != customer_id:
                self.stdout.write(self.style.ERROR('Stripe customer id mismatch for user with id {}'.format(user_id)))
                continue

            if user.payment_provider != payment_gateway:
                self.stdout.write(self.style.ERROR('Payment provider mismatch for user with id {}'.format(user_id)))
                continue
            
            count += 1
        
        self.stdout.write(self.style.SUCCESS('Checked {} users'.format(len(rows))))
        diff = len(rows) - count
        if diff:
            self.stdout.write(self.style.ERROR('Mismatched users: {}'.format(diff)))
    
    def check_shops(self, cursor):
        query = """
            SELECT s.shopify_token, s.shopify_domain, s.id
            FROM shops s
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        shops = Shop.objects.all() 
        shops = {shop.legacy_id: shop for shop in shops}
        count = 0

        for row in tqdm(rows, desc='Checking shops'):
            shopify_token, shopify_domain, shop_id = row
            shop = shops.get(shop_id)

            if shop is None:
                self.stdout.write(self.style.ERROR('Shop with id {} not found'.format(shop_id)))
                continue

            if shop.shopify_access_token != shopify_token:
                self.stdout.write(self.style.ERROR('Shopify token mismatch for shop with id {}'.format(shop_id)))
                continue
            
            if shop.url != shopify_domain:
                self.stdout.write(self.style.ERROR('Shopify domain mismatch for shop with id {}'.format(shop_id)))
                continue
            
            if shop.owner_id is None:
                self.stdout.write(self.style.ERROR('User not found for shop with id {}'.format(shop_id)))
                continue
            
            count += 1

        self.stdout.write(self.style.SUCCESS('Checked {} shops'.format(len(rows))))
        diff = len(rows) - count
        if diff:
            self.stdout.write(self.style.ERROR('Mismatched shops: {}'.format(diff)))

    def check_subscriptions(self, cursor):
        query = """
            SELECT s.id AS legacy_id, s.current_subscription, s.price_id, sh.id AS shop_id, u.payment_gateway, s.user_id
            FROM subscriptions s
            LEFT JOIN shops sh ON s.user_id = sh.user_id OR S.shop_id = sh.id
            LEFT JOIN users u ON s.user_id = u.id or sh.user_id = u.id
            WHERE s.status = 'active' OR s.status = 'trialing';
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        count = 0
        subscriptions = Subscription.objects.all()
        subscriptions = {subscription.legacy_id: subscription for subscription in subscriptions}
        plans = {plan.stripe_plan_id: plan for plan in SubscriptionPlan.objects.all()}
        shops = Shop.objects.all().select_related('owner')
        shops_by_id = {shop.legacy_id: shop for shop in shops}
        shops_by_owner = {shop.owner.legacy_id: shop for shop in shops}

        for row in tqdm(rows, desc='Checking subscriptions'):
            legacy_id, current_subscription, price_id, shop_id, payment_gateway, user_id = row
            subscription = subscriptions.get(legacy_id)

            # Skip the subscription with this missing plan
            if price_id == 'price_1LeukGKjLP5TUHIQC59uBUDV':
                continue

            if subscription is None:
                self.stdout.write(self.style.ERROR('Subscription with id {} not found'.format(legacy_id)))
                continue

            if subscription.status != ActiveStatus.ACTIVE:
                self.stdout.write(self.style.ERROR('Status mismatch for subscription with id {}'.format(legacy_id)))
                continue

            if subscription.external_id != current_subscription:
                self.stdout.write(self.style.ERROR('Current subscription mismatch for subscription with id {}'.format(legacy_id)))
                continue

            plan = plans.get(price_id)
            if plan is None:
                self.stdout.write(self.style.ERROR('Plan with id {} not found for subscription with id {}'.format(price_id, legacy_id)))
                continue

            if subscription.plan_id != plan.id:
                self.stdout.write(self.style.ERROR('Plan mismatch for subscription with id {}'.format(legacy_id)))
                continue

            shop = shops_by_id.get(shop_id)
            if shop is None and user_id is not None:
                shop = shops_by_owner.get(user_id)

            if shop is None:
                self.stdout.write(self.style.ERROR('Shop not found for subscription with id {}'.format(legacy_id)))
                continue

            if subscription.shop_id != shop.id:
                self.stdout.write(self.style.ERROR('Shop mismatch for subscription with id {}'.format(legacy_id)))
                continue

            count += 1

        self.stdout.write(self.style.SUCCESS('Checked {} subscriptions'.format(len(rows))))
        diff = len(rows) - count
        if diff:
            self.stdout.write(self.style.ERROR('Mismatched subscriptions: {}'.format(diff)))
                          
    def check_imported_products(self, cursor):
        query = """
            SELECT p.id AS legacy_id, s.id AS shop_id, p.listing_id, p.is_pushed, p.shopify_product_id, p.cost_cents, p.description
            FROM dropshippers_listing_customizations p 
            LEFT JOIN shops s ON p.user_id = s.user_id or p.shop_id = s.id;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        count = 0
        imported_products = ImportedProduct.objects.all().select_related('shop')
        imported_products = {product.legacy_id: product for product in imported_products}
        products = Product.objects.all()
        products = {product.legacy_id: product for product in products}
        variants = ImportedVariant.objects.all().select_related('variant')
        variants = {variant.imported_product_id: variant for variant in variants}

        for row in tqdm(rows, desc='Checking imported products'):
            legacy_id, shop_id, listing_id, is_pushed, shopify_product_id, cost_cents, description  = row
            imported_product = imported_products.get(legacy_id)
            product = products.get(listing_id)

            if imported_product is None:
                #self.stdout.write(self.style.ERROR('Imported product with id {} not found'.format(legacy_id)))
                continue

            imported_variant = variants.get(imported_product.id)

            if imported_product.shop.legacy_id != shop_id and shop_id is not None:
                self.stdout.write(self.style.ERROR('Shop mismatch for imported product with id {}'.format(legacy_id)))
                continue

            if product is None:
                self.stdout.write(self.style.ERROR('Product with id {} not found for imported product with id {}'.format(listing_id, legacy_id)))
                continue

            if imported_product.product_id != product.id:
                self.stdout.write(self.style.ERROR('Product mismatch for imported product with id {}'.format(legacy_id)))
                continue

            if imported_product.is_live != is_pushed:
                self.stdout.write(self.style.ERROR('Is pushed mismatch for imported product with id {}'.format(legacy_id)))
                continue

            # if imported_product.shopify_product_id != shopify_product_id:
            #     self.stdout.write(self.style.ERROR('Shopify product id mismatch for imported product with id {}'.format(legacy_id)))
            #     continue

            if imported_product.description != description:
                self.stdout.write(self.style.ERROR('Description mismatch for imported product with id {}'.format(legacy_id)))
                continue

            if imported_variant.retail_price_cents != cost_cents:
                self.stdout.write(self.style.ERROR('Cost cents mismatch for imported product with id {}'.format(legacy_id)))
                continue

            if imported_variant.variant.product_id != product.id:
                self.stdout.write(self.style.ERROR('Product mismatch for imported variant with id {}'.format(legacy_id)))
                continue

            count += 1

        self.stdout.write(self.style.SUCCESS('Checked {} imported products'.format(len(rows))))
        diff = len(rows) - count
        if diff:
            self.stdout.write(self.style.ERROR('Mismatched imported products: {}'.format(diff)))

    def check_orders(self, cursor):
        query = """
            SELECT o.id AS legacy_id, o.shop_id, o.order_number, o.order_type
            FROM orders o
            LEFT JOIN shopify_requests sr ON o.shopify_request_id = sr.id
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        count = 0
        orders = Order.objects.all().select_related('shop')
        orders = {order.legacy_id: order for order in orders}

        for row in tqdm(rows, desc='Checking orders'):
            legacy_id, shop_id, order_number, order_type = row
            order = orders.get(legacy_id)

            if order is None:
                self.stdout.write(self.style.ERROR('Order with id {} not found'.format(legacy_id)))
                continue

            if order.shop.legacy_id != shop_id:
                self.stdout.write(self.style.ERROR('Shop mismatch for order with id {}'.format(legacy_id)))
                continue

            if order.shopify_order_name != order_number:
                self.stdout.write(self.style.ERROR('Order number mismatch for order with id {}'.format(legacy_id)))
                continue

            fixed_order_type = OrderType.SHOPIFY if order_type == 'shopify' else OrderType.SAMPLE_ORDER

            if order.order_type != fixed_order_type:
                self.stdout.write(self.style.ERROR('Order type mismatch for order with id {}'.format(legacy_id)))
                continue

            count += 1
        
        self.stdout.write(self.style.SUCCESS('Checked {} orders'.format(len(rows))))
        diff = len(rows) - count
        if diff:
            self.stdout.write(self.style.ERROR('Mismatched orders: {}'.format(diff)))

    def check_sub_orders(self, cursor):
        query = """
            SELECT so.id AS legacy_id, so.order_id, so.total_cost, so.shipping_cost, so.status, so.supplier_id
            FROM sub_orders so;
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        sub_orders = SubOrder.objects.all().select_related('order')
        sub_orders = {sub_order.legacy_id: sub_order for sub_order in sub_orders}
        suppliers = Supplier.objects.all()
        suppliers = {supplier.legacy_id: supplier for supplier in suppliers}
        count = 0

        for row in tqdm(rows, desc='Checking sub orders'):
            legacy_id, order_id, total_cost, shipping_cost, status, supplier_id = row
            sub_order = sub_orders.get(legacy_id)
            supplier = suppliers.get(supplier_id)


            if sub_order is None:
                self.stdout.write(self.style.ERROR('Sub order with id {} not found'.format(legacy_id)))
                continue

            if supplier is None:
                self.stdout.write(self.style.ERROR('Supplier with id {} not found'.format(supplier_id)))
                continue
            
            if sub_order.order.legacy_id != order_id:
                self.stdout.write(self.style.ERROR('Order mismatch for sub order with id {}'.format(legacy_id)))
                continue
                
            if total_cost and sub_order.total_cost_cents != int(total_cost * 100):
                self.stdout.write(self.style.ERROR('Total cost mismatch for sub order with id {}'.format(legacy_id)))
                self.stdout.write(self.style.WARNING('v2 {} vs v1 {}'.format(sub_order.total_cost_cents, total_cost * 100)))
                continue

            if shipping_cost and sub_order.shipping_cost_cents != int(shipping_cost * 100):
                self.stdout.write(self.style.ERROR('Shipping cost mismatch for sub order with id {}'.format(legacy_id)))
                continue

            fixed_status = SubOrderStatus.PAID if status == 'paid' else SubOrderStatus.UNPAID
            if sub_order.status != fixed_status:
                self.stdout.write(self.style.ERROR('Status mismatch for sub order with id {}'.format(legacy_id)))
                continue
            
            count += 1

        self.stdout.write(self.style.SUCCESS('Checked {} sub orders'.format(len(rows))))
        diff = len(rows) - count
        if diff:
            self.stdout.write(self.style.ERROR('Mismatched sub orders: {}'.format(diff)))

    def check_line_items(self, cursor):
        query = """
            SELECT li.id AS legacy_id, li.sub_order_id, li.title, li.cost_cents, li.total_shipping, li.quantity, 
            li.shopify_product_id, li.total_cost, li.listing_id, li.variation_id, li.total_shopify_cost
            FROM line_items li;
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        count = 0

        line_items = LineItem.objects.all().select_related('sub_order')
        line_items = {line_item.legacy_id: line_item for line_item in line_items}

        for row in tqdm(rows, desc='Checking line items'):
            legacy_id, sub_order_id, title, cost_cents, total_shipping, quantity, shopify_product_id, total_cost, product_id, variant_id, total_shopify_cost = row

            line_item = line_items.get(legacy_id)

            if line_item is None:
                self.stdout.write(self.style.ERROR('Line item with id {} not found'.format(legacy_id)))
                continue

            if str(line_item.sub_order.legacy_id) != sub_order_id:
                self.stdout.write(self.style.ERROR('Sub order mismatch for line item with id {}'.format(legacy_id)))
                self.stdout.write(self.style.WARNING('v2 {} vs v1 {}'.format(line_item.sub_order.legacy_id, sub_order_id)))
                continue

            if line_item.title != title:
                self.stdout.write(self.style.ERROR('Title mismatch for line item with id {}'.format(legacy_id)))
                continue
                
            if cost_cents and line_item.cost_cents != int(cost_cents * 100):
                self.stdout.write(self.style.ERROR('Cost cents mismatch for line item with id {}'.format(legacy_id)))
                continue

            if total_shipping and line_item.total_shipping_cost_cents != int(total_shipping * 100):
                self.stdout.write(self.style.ERROR('Total shipping mismatch for line item with id {}'.format(legacy_id)))
                continue

            if quantity and line_item.quantity != quantity:
                self.stdout.write(self.style.ERROR('Quantity mismatch for line item with id {}'.format(legacy_id)))
                continue

            if shopify_product_id and line_item.shopify_product_id != f"gid://shopify/Product/{shopify_product_id}":
                self.stdout.write(self.style.ERROR('Shopify product id mismatch for line item with id {}'.format(legacy_id)))
                self.stdout.write(self.style.WARNING('v2 {} vs v1 {}'.format(line_item.shopify_product_id, shopify_product_id)))
                continue

            if total_cost and line_item.total_cost_cents != int(total_cost * 100):
                self.stdout.write(self.style.ERROR('Total cost mismatch for line item with id {}'.format(legacy_id)))
                self.stdout.write(self.style.WARNING('v2 {} vs v1 {}'.format(line_item.total_cost_cents, int(total_cost * 100))))
                continue

    def handle(self, *args, **options):
        connection_string = options['connection_string']

        try:
            # Connect to PostgreSQL
            connection = psycopg2.connect(connection_string)
            cursor = connection.cursor()
            # Running sanity checks
            self.check_users(cursor)
            self.check_shops(cursor)
            self.check_subscriptions(cursor)
            self.check_imported_products(cursor)
            self.check_orders(cursor)
            self.check_sub_orders(cursor)
            self.check_line_items(cursor)
            self.stdout.write(self.style.SUCCESS('Sanity checks finished successfully'))
            # Close the cursor and connection
            cursor.close()
            connection.close()

        except OperationalError as e:
            self.stdout.write(self.style.ERROR('Operational Error occurred while connecting to the database: {}'.format(e)))