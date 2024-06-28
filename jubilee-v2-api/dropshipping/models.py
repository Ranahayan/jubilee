from django.db import models
from authentication.models import Shop
from file.models import File
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from .helpers import cents_to_real
from django.conf import settings
from django.utils import timezone
from django.db.models import Q


class BrandType(models.TextChoices):
    UNBRANDED = "unbranded", "Unbranded"
    BRAND_NAME = "brand_name", "Brand name"
    BRAND_LOGO = "brand_logo", "Brand logo"


class ProductType(models.TextChoices):
    WHOLESALE = "wholesale", "Wholesale"
    DROPSHIP_BRANDED = "dropship_branded", "Dropship branded"
    DROPSHIP_UNBRANDED = "dropship_unbranded", "Dropship unbranded"


class OrderType(models.TextChoices):
    SAMPLE_ORDER = "sample_order", "Sample order"
    SHOPIFY = "shopify", "Shopify"


class SubOrderStatus(models.TextChoices):
    UNPAID = "unpaid", "Unpaid"
    PAID = "paid", "Paid"
    PROCESSING = "processing", "Processing"
    REFUNDED = "refunded", "Refunded"


class Shipping(models.Model):
    base_price_cents = models.IntegerField()
    incremental_price_cents = models.IntegerField()
    delivery_time = models.CharField(max_length=10)  # e.g. 1-3 or 10-20
    processing_time = models.CharField(
        max_length=10, null=True, blank=True
    )  # e.g. 1-3 or 10-20
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery in {self.delivery_time} days: base {cents_to_real(self.base_price_cents)}, incremental {cents_to_real(self.incremental_price_cents)}"


class Address(models.Model):
    line_1 = models.CharField(max_length=255, null=True, blank=True)
    line_2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    country = models.CharField(max_length=255, null=True, blank=True)
    zip = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.line_1}, {self.city}, {self.state}, {self.country}, {self.zip}"


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, null=True, blank=True)
    bank_account = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    address = models.ForeignKey(
        Address, on_delete=models.SET_NULL, null=True, blank=True
    )
    shipping = models.ForeignKey(Shipping, on_delete=models.PROTECT)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the supplier's ID in the legacy system
    shopify_moq = models.SmallIntegerField(default=0) # Minimum Order Quantity for Shopify
    shopify_moq_price_cents = models.IntegerField(default=0) # Minimum Order Quantity price for Shopify
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "(inactive)" if not self.is_active else ""
        shipping = self.shipping.__str__() if self.shipping else "No default shipping"
        return f"{self.name} ({self.email or 'No Email'}), {shipping} {status}"


class Category(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    is_visible = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    image = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    legacy_id = models.UUIDField(null=True, blank=True) # This is the category's ID in the legacy system
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def all_children(self):
        children = list(self.children.all())
        for child in self.children.all():
            children += child.all_children()
        return children

    def __str__(self):
        status = ""
        if not self.is_active:
            status = "(inactive)"
        elif not self.is_visible:
            status = "(hidden)"
        return f"{self.name} {status}"


class Product(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="products",
    )
    shipping_fallback = models.ForeignKey(
        Shipping, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    tags = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    branding_type = models.CharField(
        max_length=100,
        choices=BrandType.choices,
        default=BrandType.UNBRANDED,
    )
    moq_quantity = models.SmallIntegerField(default=1)
    is_premium = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the product's ID in the legacy system
    accept_worldwide_shipping = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "(inactive)" if not self.is_active else ""
        return f"{self.title} by {self.supplier.name} {status}"

    class Meta:
        indexes = [GinIndex(fields=["title"])]


class ProductShipping(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    shipping = models.ForeignKey(Shipping, on_delete=models.CASCADE)
    country = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.shipping.__str__()} to {self.country}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "country"], name="unique_product_country"
            )
        ]


class ProductOption(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="options"
    )
    name = models.CharField(max_length=255)
    values = ArrayField(models.CharField(max_length=100))

    def __str__(self):
        return f"{self.name}: {self.values}"


class ProductAsset(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='assets')
    image = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    thumbnail = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    order = models.SmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.image is not None:
            return f"Asset {self.image.file_name} from {self.product.title}"
        else:
            return f"Asset from {self.product.title}"


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    title = models.CharField(max_length=255)
    image = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    thumbnail = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    weight = models.FloatField(null=True, blank=True)
    sku = models.CharField(max_length=255)
    inventory_quantity = models.IntegerField(null=True, blank=True)
    price_cents = models.IntegerField()
    retail_price_cents = models.IntegerField(null=True, blank=True)
    product_type = models.CharField(
        max_length=100,
        choices=ProductType.choices,
        default=ProductType.DROPSHIP_UNBRANDED,
    )
    is_active = models.BooleanField(default=True)
    selected_options = ArrayField(models.CharField(max_length=100), null=True, blank=True)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the variant's ID in the legacy system
    brand_settings = models.ForeignKey('dropshipping.BrandSettings', on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_composed_title(self):
        title = self.product.title
        if self.title:
            title += f" - {self.title}"

        if self.product.options.count() > 0:
            for opt in self.selected_options:
                title += f" - {opt}"

        return title

    def update_inventory(self, quantity):
        if not settings.INVENTORY_MANAGEMENT:
            return
        self.inventory_quantity = max(self.inventory_quantity - quantity, 0)
        self.save()

    def __str__(self):
        status = "(inactive)" if not self.is_active else ""
        return f"{self.title} variant from {self.product.title} {status}"


class ImportedProduct(models.Model):
    shop = models.ForeignKey(
        "authentication.Shop",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="imported_products",
    )
    user = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="imported_products",
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="+")
    description = models.TextField(null=True, blank=True)
    tags = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    collections = ArrayField(models.CharField(max_length=200), blank=True, null=True)
    is_live = models.BooleanField(default=False)
    live_at = models.DateTimeField(null=True)
    background_color = models.CharField(max_length=50, null=True, blank=True)
    shopify_product_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_product_link = models.URLField(max_length=255, null=True, blank=True)
    legacy_id = models.UUIDField(null=True, blank=True) # This is the product's ID in the legacy system
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "(live)" if self.is_live else ""
        return f"{self.product.__str__()} {status}"

    def get_by_user(user):
        try:
            shop = Shop.objects.get_by_user_id(user.id)
            return ImportedProduct.objects.filter(Q(shop=shop) | Q(user=user))
        except Shop.DoesNotExist:
            return ImportedProduct.objects.filter(user=user)


class ImportedVariant(models.Model):
    imported_product = models.ForeignKey(
        ImportedProduct, on_delete=models.CASCADE, related_name="imported_variants"
    )
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, related_name="+"
    )
    retail_price_cents = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    shopify_variant_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_inventory_item_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_inventory_level_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_available_quantity = models.IntegerField(null=True, blank=True)
    # Branded images
    image = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    thumbnail = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.variant.__str__()}. Retail price: {cents_to_real(self.retail_price_cents)}"


class DropshipSettings(models.Model):
    user = models.ForeignKey('authentication.CustomUser', on_delete=models.SET_NULL, blank=True, null=True)
    shop = models.ForeignKey('authentication.Shop', on_delete=models.SET_NULL, blank=True, null=True)
    shopify_location_id = models.CharField(max_length=100, null=True, blank=True)
    brand_name = models.CharField(max_length=100, null=True, blank=True)
    brand_logo = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    font_family = models.CharField(max_length=100, null=True, blank=True)
    products_background_color = models.CharField(max_length=50, null=True, blank=True)
    invoice_store_name = models.CharField(max_length=100, null=True, blank=True)
    invoice_contact_email = models.EmailField(max_length=100, null=True, blank=True)
    invoice_website = models.CharField(max_length=512, null=True, blank=True)
    invoice_logo = models.ForeignKey(File, on_delete=models.SET_NULL, blank=True, null=True, related_name="+")
    invoice_body = models.TextField(null=True, blank=True)
    distributor_city = models.CharField(max_length=100, null=True, blank=True)
    distributor_zip = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dropship settings for {self.user.name if self.user else self.shop.url}"


class Customer(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Order(models.Model):
    shop = models.ForeignKey(
        "authentication.Shop", on_delete=models.SET_NULL, null=True, blank=True
    )
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, null=True, blank=True
    )
    user = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    shipping_address = models.ForeignKey(
        Address, on_delete=models.PROTECT, null=True, blank=True
    )
    shopify_order_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_order_name = models.CharField(max_length=100, null=True, blank=True)
    order_type = models.CharField(
        max_length=100,
        choices=OrderType.choices,
        default=OrderType.SHOPIFY,
    )
    is_active = models.BooleanField(default=True)
    legacy_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.order_type == OrderType.SAMPLE_ORDER:
            return f"({self.order_type}) #{1001 + self.id} from {self.shop.url if self.shop else (self.user.name if self.user else None)}"
        else:
            return f"({self.order_type}) {self.shopify_order_name} from {self.shop.url if self.shop else None}"

    def get_by_user(user):
        try:
            shop = Shop.objects.get_by_user_id(user.id)
            return Order.objects.filter(Q(shop=shop) | Q(user=user))
        except Shop.DoesNotExist:
            return Order.objects.filter(user=user)

    @property
    def checkout_at(self):
        return self.sub_orders.first().checkout_at


class SubOrder(models.Model):
    shop = models.ForeignKey(
        "authentication.Shop", on_delete=models.SET_NULL, null=True, blank=True
    )
    user = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="sub_orders"
    )
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    total_cost_cents = models.IntegerField()
    shipping_cost_cents = models.IntegerField()
    status = models.CharField(
        max_length=15,
        choices=SubOrderStatus.choices,
        default=SubOrderStatus.UNPAID,
    )
    # Stripe information
    checkout_at = models.DateTimeField(null=True, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=100, null=True, blank=True)
    # Tracking information
    tracking_carrier = models.CharField(max_length=100, null=True, blank=True)
    tracking_number = models.CharField(max_length=255, null=True, blank=True)
    tracking_link = models.URLField(max_length=255, null=True, blank=True)
    # This is the suborder's ID in the legacy system
    legacy_id = models.UUIDField(null=True, blank=True)
    # Internal Management
    is_processed = models.BooleanField(default=False)
    note = models.TextField(null=True, blank=True)
    # Default date fields
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_cancelled = models.BooleanField(default=False)

    def get_transaction_fee(self):
        return (
            settings.TRANSACTION_PERCENTAGE
            * (self.total_cost_cents + self.shipping_cost_cents)
        ) + settings.TRANSACTION_FIXED_COST

    @property
    def total_price(self):
        """
        Calculate the total price of the suborder including transaction fees.
        """
        return self.total_cost_cents + self.shipping_cost_cents + self.get_transaction_fee()
    
    def get_status_display(self):
        """Return the status display of the suborder"""
        if self.is_cancelled:
            return "cancelled"
    
        if self.status == "unpaid":
            return "unpaid"
        
        if self.status == "refunded":
            return "refunded"

        if self.tracking_number or self.tracking_link:
            return "shipped"

        return "processing"

    def update_costs(self, check_if_accepts_worldwide_shipping=False):
        """Call this function to update the costs of the suborder"""
        total_cost_cents = 0
        shipping_cost_cents = 0
        line_items = self.line_items.all()

        for i, line_item in enumerate(line_items):
            # Recalculate the line item shipping
            # The first line item includes the base fee
            line_item.update_costs(i == 0, check_if_accepts_worldwide_shipping)
            # Update costs
            total_cost_cents += line_item.total_cost_cents
            shipping_cost_cents += line_item.total_shipping_cost_cents

        self.total_cost_cents = total_cost_cents
        self.shipping_cost_cents = shipping_cost_cents
        self.save()

    def __str__(self):
        status = "(unpaid)" if self.status == SubOrderStatus.UNPAID else ""
        return f"Sub Order for {self.supplier.name} {status}"

    def get_by_user(user):
        try:
            shop = Shop.objects.get_by_user_id(user.id)
            return SubOrder.objects.filter(Q(shop=shop) | Q(user=user))
        except Shop.DoesNotExist:
            return SubOrder.objects.filter(user=user)


class ShippingCountryRequiredException(Exception):
    pass


class ShippingNotAvailableException(Exception):
    pass


class LineItem(models.Model):
    sub_order = models.ForeignKey(
        SubOrder, on_delete=models.CASCADE, related_name="line_items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    sku = models.CharField(max_length=100)
    # All costs
    cost_cents = models.IntegerField(default=0)  # Per unit
    total_cost_cents = models.IntegerField(default=0)  # Total
    total_shipping_cost_cents = models.IntegerField(default=0)
    # Shopify fields
    shopify_fulfillment_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_product_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_variant_id = models.CharField(max_length=100, null=True, blank=True)
    shopify_price_cents = models.IntegerField(null=True, blank=True)
    # This is the line item's ID in the legacy system
    legacy_id = models.UUIDField(null=True, blank=True)
    # Default date fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} from {self.sub_order.supplier.name}"

    def update_costs(self, includes_the_base, check_if_accepts_worldwide_shipping):
        """
        Update all costs for this line item.
        If includes_the_base is True, the shipping cost base fee will be included in the shipping cost.
        """
        variant = self.variant

        # Shipping Cost
        shipping_country = None
        if self.sub_order.order.shipping_address:
            shipping_country = self.sub_order.order.shipping_address.country

        accept_worldwide_shipping = self.product.accept_worldwide_shipping
        if check_if_accepts_worldwide_shipping is False:
            accept_worldwide_shipping = True

        if accept_worldwide_shipping is False and shipping_country is None:
            raise ShippingCountryRequiredException()

        shipping = None
        if shipping_country is not None:
            shipping = Shipping.objects.filter(
                productshipping__product=self.product,
                productshipping__country__iexact=shipping_country,
            ).first()

            if (shipping is None
                    and self.product.supplier.address
                    and self.product.supplier.address.country == shipping_country
                    ):
                shipping = self.product.supplier.shipping

            if accept_worldwide_shipping is False and shipping is None:
                raise ShippingNotAvailableException()

        if shipping is None:
            shipping = self.product.shipping_fallback or self.product.supplier.shipping

        if includes_the_base:
            shipping_cost_cents = shipping.base_price_cents + (
                shipping.incremental_price_cents * (self.quantity - 1)
            )
        else:
            shipping_cost_cents = shipping.incremental_price_cents * self.quantity

        self.total_shipping_cost_cents = shipping_cost_cents
        # Product Cost
        self.cost_cents = variant.price_cents
        self.total_cost_cents = variant.price_cents * self.quantity
        self.save()

class BrandSettings(models.Model):
    x = models.FloatField(verbose_name='X Position')
    y = models.FloatField(verbose_name='Y Position')
    width = models.FloatField(verbose_name='Width')
    height = models.FloatField(verbose_name='Height')
    rotation = models.FloatField(verbose_name='Rotation')
    text_color = models.CharField(max_length=50, verbose_name='Text Color')

    def __str__(self):
        return f"Brand settings: {self.x}, {self.y}, {self.width}, {self.height}, {self.rotation}, {self.text_color}"

class ImageDescription(models.Model):
    file = models.OneToOneField(File, on_delete=models.CASCADE, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"({self.file_id}) {self.description}"
