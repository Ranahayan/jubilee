from file.models import File
from rest_framework import serializers
from .models import BrandSettings, Category, Product, ProductVariant, ProductAsset, Shipping, ImportedProduct, ProductOption, Order, SubOrder, LineItem, Customer, Address, Supplier, ImportedProduct, ImportedVariant, Order, SubOrder, LineItem, DropshipSettings, ProductShipping
from dropshipping.helpers import apply_dynamic_pricing

class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        exclude = ["created_at", "updated_at"]

    def get_image(self, obj):
        if obj.image is not None:
            return obj.image.url

class CategoryUserUpdateSerializer(serializers.Serializer):
    categories = serializers.ListField(child=serializers.IntegerField(allow_null=True), allow_null=True)

class VariantSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    selected_options = serializers.SerializerMethodField()
    retail_price_cents = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        exclude = ["created_at", "updated_at", "product"]

    def get_image(self, obj):
        if obj.image is not None:
            return obj.image.url
        
    def get_selected_options(self, obj):
        """
            This method is responsible for formatting the selected option in a JSON format.
            eg: [{ "name": "Size", "value": "L" }, { "name": "Color", "value": "Red" }]
        """
        options = obj.product.options.all()
        if len(options) > 0:
            selected_options = []
            for opt in obj.selected_options:
                for option in options:
                    if opt in option.values:
                        selected_options.append({
                            "name": option.name,
                            "value": opt
                        })
            return selected_options
        else:
            return []
    
    def get_retail_price_cents(self, obj):
        return apply_dynamic_pricing(obj.price_cents)

class ProductAssetSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    class Meta:
        model = ProductAsset
        exclude = ["created_at", "updated_at", "product"]

    def get_image(self, obj):
        if obj.image is not None:
            return obj.image.url

    def get_thumbnail(self, obj):
        if obj.thumbnail is not None:
            return obj.thumbnail.url

class ProductAssetPayloadSerializer(serializers.ModelSerializer):
    image = serializers.PrimaryKeyRelatedField(queryset=File.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = ProductAsset
        fields = '__all__'


class ShippingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipping
        exclude = ["created_at", "updated_at", "id"]

class ProductOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOption
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    variants = serializers.SerializerMethodField()
    assets = serializers.SerializerMethodField()
    supplier = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    shipping_options = serializers.SerializerMethodField()
    shipping_fallback = serializers.SerializerMethodField()
    options = ProductOptionSerializer(many=True, read_only=True)
    is_imported = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        exclude = ["created_at", "updated_at"]

    def get_is_imported(self, obj):
        # Always return this field as False; it will be changed in the view if necessary.
        return False

    def get_assets(self, obj):
        assets = []
        active_variants = obj.variants.filter(is_active=True)

        for variant in active_variants:
            if variant.image:
                assets.append({
                    "image": variant.image.url,
                    "thumbnail": variant.thumbnail.url if variant.thumbnail else None,
                    "order": 0,
                })

        assets += ProductAssetSerializer(obj.assets, many=True).data

        return assets

    def get_variants(self, obj):
        active_variants = obj.variants.filter(is_active=True).prefetch_related('product__options')
        serializer = VariantSerializer(active_variants, many=True)
        return serializer.data

    def get_supplier(self, obj):
        return obj.supplier.name

    def get_country(self, obj):
        if obj.supplier.address:
            return obj.supplier.address.country

    def get_shipping_options(self, obj):
        product_shippings = obj.productshipping_set.all()

        supplier_country = self.get_country(obj)

        shippings_list = [{"shipping": ShippingSerializer(product_shipping.shipping).data,
                           "country": product_shipping.country
                           } for product_shipping in product_shippings]

        shippings_list_includes_supplier_country = any(
            (product_shipping["country"] == supplier_country
             for product_shipping in shippings_list))

        supplier_shipping_is_fallback = obj.accept_worldwide_shipping is True and obj.shipping_fallback is None

        if (supplier_country is not None
            and not supplier_shipping_is_fallback
                and not shippings_list_includes_supplier_country):
            shippings_list.append({
                "shipping": ShippingSerializer(obj.supplier.shipping).data,
                "country": supplier_country})

        return shippings_list

    def get_shipping_fallback(self, obj):
        if obj.accept_worldwide_shipping is False:
            return None

        shipping = obj.shipping_fallback or obj.supplier.shipping

        if shipping:
            return ShippingSerializer(shipping).data

        return None

    def get_category_name(self, obj):
        if obj.category is not None:
            return obj.category.name

        return None


class ImportedProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportedProduct
        exclude = ["created_at", "updated_at"]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        product = instance.product

        assets = []

        product_data = ProductSerializer(product).data
        product_data["is_live"] = representation["is_live"]
        product_data["shopify_product_link"] = representation["shopify_product_link"]
        product_data["background_color"] = representation["background_color"]

        if representation['description'] is not None:
            product_data['description'] = representation['description']

        if representation['tags'] is not None:
            product_data['tags'] = representation['tags']

        if representation['collections'] is not None:
            product_data['collections'] = representation['collections']

        imported_variants_dict = {v.variant_id: v for v in instance.imported_variants.all()}

        for variant in product_data["variants"]:
            imported_variant = imported_variants_dict.get(variant["id"])
            variant["imported_variant_id"] = None

            if imported_variant:
                variant["imported_variant_id"] = imported_variant.id
                variant["is_active"] = imported_variant.is_active
                if imported_variant.retail_price_cents is not None:
                    variant["retail_price_cents"] = imported_variant.retail_price_cents
                else:
                    variant["retail_price_cents"] = apply_dynamic_pricing(variant["price_cents"])
                
                if imported_variant.image is not None:
                    variant["image"] = imported_variant.image.url

            assets.append({
                "id": variant["imported_variant_id"],
                "image": variant["image"],
                "order": 0
            })

        for asset in product.assets.all():
            assets.append({
                "id": asset.id,
                "image": asset.image.url,
                "order": asset.order
            })

        product_data["assets"] = assets
        return product_data

class ImportedVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportedVariant
        exclude = ["created_at", "updated_at"]

class ImportedProductUpdateSerializer(serializers.Serializer):
    description = serializers.CharField(required=False, allow_blank=True)
    background_color = serializers.CharField(required=False, allow_blank=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    collections = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    is_live = serializers.BooleanField(required=False)
    title = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        product_fields = ["title"]
        product_updated = False

        product = instance.product

        for field in product_fields:
            if field in validated_data:
                setattr(product, field, validated_data[field])
                product_updated = True

        if product_updated:
            product.save()

        for field in ["description", "background_color", "tags", "collections", "is_live"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        return instance

class ImportedVariantUpdateSerializer(serializers.Serializer):
    retail_price_cents = serializers.IntegerField(required=True)

class SampleOrderPayloadSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True)
    additive = serializers.BooleanField(required=False, default=False)

class AddressPayloadSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    line_1 = serializers.CharField(required=True)
    line_2 = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=True)
    state = serializers.CharField(required=True)
    country = serializers.CharField(required=True)
    zip = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)

class LineItemSerializer(serializers.ModelSerializer):
    moq_quantity = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    supplier = serializers.SerializerMethodField()

    class Meta:
        model = LineItem
        exclude = ["created_at", "updated_at"]

    def get_moq_quantity(self, obj):
        if obj.product is None:
            return 1

        return obj.product.moq_quantity

    def get_available_quantity(self, obj):
        if obj.variant is None:
            return 100
        return obj.variant.inventory_quantity

    def get_image(self, obj):
        if not obj.product or not obj.variant:
            return None

        if obj.variant.image is not None:
            return obj.variant.image.url

        if asset := obj.product.assets.first():
            return asset.image.url
        
    def get_supplier(self, obj):
        return obj.product.supplier.name

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["name"]

class SubOrderSerializer(serializers.ModelSerializer):
    line_items = LineItemSerializer(many=True, read_only=True)
    supplier = SupplierSerializer(read_only=True)
    transaction_fee = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = SubOrder
        exclude = ["created_at", "updated_at"]

    def get_transaction_fee(self, obj):
        return obj.get_transaction_fee()
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        exclude = ["created_at", "updated_at"]

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        exclude = ["created_at", "updated_at"]

class OrderSerializer(serializers.ModelSerializer):
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    shipping_address = AddressSerializer(read_only=True)

    class Meta:
        model = Order
        exclude = ["updated_at"]


class DropshipSettingsPayloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DropshipSettings
        exclude = ["created_at", "updated_at"]

class DropshipSettingsSerializer(serializers.ModelSerializer):
    invoice_logo = serializers.SerializerMethodField()
    brand_logo = serializers.SerializerMethodField()

    class Meta:
        model = DropshipSettings
        exclude = ["created_at", "updated_at"]

    def get_invoice_logo(self, obj):
        if obj.invoice_logo is not None:
            return {
                "id": obj.invoice_logo.id,
                "url": obj.invoice_logo.url,
                "file_name": obj.invoice_logo.original_file_name
            }
    
    def get_brand_logo(self, obj):
        if obj.brand_logo is not None:
            return {
                "id": obj.brand_logo.id,
                "url": obj.brand_logo.url,
                "file_name": obj.brand_logo.original_file_name
            }

class BrandSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandSettings
        fields = '__all__'

