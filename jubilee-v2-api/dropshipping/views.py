from dropshipping.tasks import create_fulfillment_for_subOrder, delete_bulk_imported_products, update_bulk_imported_products, sync_product_variants
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import (
    BrandSettings,
    Category,
    ProductShipping,
    ShippingCountryRequiredException,
    ShippingNotAvailableException,
    Product,
    BrandType,
    ImportedProduct,
    ImportedVariant,
    ProductVariant,
    Order,
    SubOrder,
    LineItem,
    OrderType,
    SubOrderStatus,
    Customer,
    Address,
    DropshipSettings,
    ProductAsset,
)
from authentication.models import Shop
from .serializers import (
    BrandSettingsSerializer,
    CategorySerializer,
    CategoryUserUpdateSerializer,
    LineItemSerializer,
    ProductSerializer,
    ImportedProductSerializer,
    ImportedProductUpdateSerializer,
    ImportedVariantUpdateSerializer,
    ImportedVariantSerializer,
    SampleOrderPayloadSerializer,
    AddressPayloadSerializer,
    OrderSerializer,
    DropshipSettingsSerializer,
    AddressSerializer,
    SubOrderSerializer,
    CustomerSerializer,
    DropshipSettingsPayloadSerializer,
    ProductAssetPayloadSerializer,
)
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.core.paginator import Paginator, EmptyPage
from .errors import ResponseError
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Q, Avg, Count
from .services import (
    create_dropship_settings,
    ImportedProductService,
    get_fulfillment_order,
    get_image_description,
    update_shopify_variant,
    get_shop_details,
)
from billing.stripe import create_one_time_payment_with_transfer, create_stripe_charge
from billing.models import Subscription, ActiveStatus
from django.shortcuts import render
from datetime import datetime
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger(__name__)

from django.db.models import Prefetch
from functools import reduce
import operator


class CategoryList(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: CategorySerializer(many=True)})
    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=CategoryUserUpdateSerializer,
        responses={200: "message: Updated successfully" }
    )
    def put(self, request):
        user = request.user

        serializer = CategoryUserUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)
        
        categories = serializer.data.get('categories')
        if categories is not None:
            user.categories.set(categories)
        else:
            user.categories.clear()
        user.save()

        return Response("Updated successfully", status=status.HTTP_200_OK)
    
class ProductList(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "page",
                openapi.IN_QUERY,
                description="Page number",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "is_premium",
                openapi.IN_QUERY,
                description="Filter by premium status",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "is_moq",
                openapi.IN_QUERY,
                description="Filter by MOQ status",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "branding_type",
                openapi.IN_QUERY,
                description="Filter by branding type",
                type=openapi.TYPE_STRING,
                enum=["unbranded", "branded", "brand_name", "brand_logo"],
            ),
            openapi.Parameter(
                "category",
                openapi.IN_QUERY,
                description="Filter by category ID",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "tags",
                openapi.IN_QUERY,
                description='Filter by tags. eg: "sport,trending"',
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "search_term",
                openapi.IN_QUERY,
                description="Filter by search term",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "search_image_id",
                openapi.IN_QUERY,
                description="Filter by image",
                type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                "sort_by_price",
                openapi.IN_QUERY,
                description="Sort by price",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                "sort_by_created_at",
                openapi.IN_QUERY,
                description="Sort by created_at",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                "sort_by_number_of_orders",
                openapi.IN_QUERY,
                description="Sort by number of orders",
                type=openapi.TYPE_STRING
            )
        ],
        responses={200: ProductSerializer(many=True)},
    )
    def get(self, request):
        page = int(request.GET.get("page", 1))
        has_premium_filter = "is_premium" in request.GET
        is_premium = request.GET.get("is_premium", "").lower() == "true"
        has_moq_filter = "is_moq" in request.GET
        is_moq = request.GET.get("is_moq", "").lower() == "true"
        branding_type = request.GET.get("branding_type", "").lower()
        category_id = request.GET.get("category")
        tags = request.GET.get("tags")
        search_term = request.GET.get("search_term")
        search_image_id = request.GET.get("search_image_id")
        sort_by_price = str(request.GET.get("sort_by_price")).lower()
        sort_by_created_at = str(request.GET.get("sort_by_created_at")).lower()
        sort_by_number_of_orders = str(
            request.GET.get("sort_by_number_of_orders")).lower()

        products = Product.objects.filter(is_active=True)
        imported_products = ImportedProduct.get_by_user(request.user)

        if search_image_id:
            image_description_result = get_image_description(search_image_id)

            if isinstance(image_description_result, Response):
                return image_description_result

            search_term = image_description_result

        if search_term:
            products = (
                products.annotate(
                    title_similarity=TrigramSimilarity("title", search_term)
                )
                .filter(title_similarity__gt=0.05)
                .order_by("-title_similarity")
            )
        else:
            products = products.order_by("?")

        if sort_by_price:
            products = products.annotate(
                price_cents=Avg("variants__price_cents", default=0)
            )

            if sort_by_price == "asc":
                products = products.order_by("price_cents")
            elif sort_by_price == "desc":
                products = products.order_by("-price_cents")

        if sort_by_created_at == "asc":
            products = products.order_by("created_at")
        elif sort_by_created_at == "desc":
            products = products.order_by("-created_at")

        if sort_by_number_of_orders:
            products = products.annotate(
                number_of_orders=Count("lineitem__sub_order__order")
            )

            if sort_by_number_of_orders == "asc":
                products = products.order_by("number_of_orders")
            elif sort_by_number_of_orders == "desc":
                products = products.order_by("-number_of_orders")

        if has_premium_filter:
            products = products.filter(is_premium=is_premium)

        if has_moq_filter:
            if is_moq:
                products = products.filter(moq_quantity__gt=1)
            else:
                products = products.filter(moq_quantity=1)

        if branding_type:
            if branding_type == "branded":
                products = products.exclude(branding_type=BrandType.UNBRANDED)
            else:
                products = products.filter(branding_type=branding_type)

        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                categories = list(category.all_children()) + [category]
                products = products.filter(category__in=categories)
            except Category.DoesNotExist:
                return ResponseError.invalid_category()

        if tags:
            tags = tags.split(",")
            products = products.filter(tags__contains=tags)

        try:
            paginator = Paginator(products, 20)
            result = paginator.page(page)
        except EmptyPage:
            return ResponseError.page_is_invalid()

        serializer = ProductSerializer(result, many=True)
        products_result = serializer.data

        for product in products_result:
            product["is_imported"] = imported_products.filter(
                product_id=product["id"]
            ).exists()

        response = {
            "total_pages": paginator.num_pages,
            "page": page,
            "data": products_result,
        }
        return Response(response, status=status.HTTP_200_OK)


class ImportedProductList(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "page",
                openapi.IN_QUERY,
                description="Page number",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "filter",
                openapi.IN_QUERY,
                description="Filter by low_stock, out_of_stock or deactivated",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: ImportedProductSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        page = int(request.GET.get("page", 1))
        search_term = request.GET.get("search_term")
        is_live = request.GET.get("is_live", "").lower() == "true"
        filter_options = request.GET.get("filter", "")
        active_filters = filter_options.lower().split(",")

        active_variants_prefetch = Prefetch(
            'product__variants',
            queryset=ProductVariant.objects.filter(is_active=True)
        )

        productshipping_prefetch = Prefetch(
            'product__productshipping_set',
            queryset=ProductShipping.objects.all()
        )

        imported_variants_prefetch = Prefetch(
            'imported_variants',
            queryset=ImportedVariant.objects.all()
        )

        imported_products = (
            ImportedProduct.get_by_user(user)
            .filter(is_live=is_live)
            .order_by("-created_at")
            .select_related(
                'product',
                'product__supplier',
                'product__supplier__address',
                'product__shipping_fallback'
            )
            .prefetch_related(
                active_variants_prefetch,
                productshipping_prefetch,
                imported_variants_prefetch
            )
        )

        if search_term:
            imported_products = (
                imported_products.annotate(
                    title_similarity=TrigramSimilarity("product__title", search_term)
                )
                .filter(title_similarity__gt=0.05, is_live=is_live)
                .order_by("-title_similarity")
            )
        elif is_live:
            imported_products = imported_products.order_by("?")

        filter_conditions = Q()

        if "low_stock" in active_filters:
            filter_conditions |= Q(product__variants__inventory_quantity__lt=10)

        if "out_of_stock" in active_filters:
            filter_conditions |= Q(product__variants__inventory_quantity__lte=0)

        if filter_conditions:
            imported_products = imported_products.filter(filter_conditions, is_live=is_live)

        try:
            paginator = Paginator(imported_products, 20)
            result = paginator.page(page)
        except EmptyPage:
            return ResponseError.page_is_invalid()

        serializer = ImportedProductSerializer(result, many=True)

        response = {
            "total_pages": paginator.num_pages,
            "page": page,
            "data": serializer.data,
        }

        return Response(response, status=status.HTTP_200_OK)


class ImportedProductListDetail(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: ImportedProductSerializer})
    def post(self, request, product_id):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)

        try:
            shop = Shop.objects.get_by_user_id(user.id)
        except Shop.DoesNotExist:
            shop = None

        subscription = Subscription.objects.filter(
            user=user, status=ActiveStatus.ACTIVE
        ).first()

        try:
            Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return ResponseError.product_not_found()
        
        if subscription is None:
            return ResponseError.subscription_not_found()

        if subscription is None and not settings.DISABLE_PAYMENTS:
            return ResponseError.subscription_not_found()

        # Check if the product is already imported
        imported_product = imported_products.filter(
            product_id=product_id
        ).first()

        if imported_product:
            return ResponseError.product_already_imported()
        else:
            product_details = Product.objects.get(id=product_id)
            # Import the product
            if shop is None:
                imported_product = ImportedProduct.objects.create(
                    user=user,
                    product_id=product_id,
                    description=product_details.description,
                    is_live=False,
                )
            else:
                imported_product = ImportedProduct.objects.create(
                    shop=shop, user=user, product_id=product_id
                )

        serializer = ImportedProductSerializer(imported_product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(responses={200: ImportedProductSerializer})
    def delete(self, request, product_id):
        return ImportedProductService.delete_imported_product(request.user, product_id)

    @swagger_auto_schema(
        request_body=ImportedProductUpdateSerializer,
        responses={200: ImportedProductSerializer},
    )
    def put(self, request, product_id):
        return ImportedProductService.update_imported_product(request.user, product_id, request.data)

class UpdateImportedVariant(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=ImportedVariantUpdateSerializer,
        responses={200: ImportedVariantSerializer},
    )
    def put(self, request, variant_id):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)

        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return ResponseError.variant_not_found()

        serializer = ImportedVariantUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        product = Product.objects.get(id=variant.product.id)

        imported_product = imported_products.filter(
            product_id=product.id
        ).first()

        variants = ImportedVariant.objects.filter(
            imported_product=imported_product,
            variant=variant
        ).order_by('-id')

        if variants.count() > 1:
            latest_variant = variants.first()
            variants.exclude(id=latest_variant.id).delete()

        imported_variant, updated = ImportedVariant.objects.update_or_create(
            imported_product=imported_product,
            variant=variant,
            defaults={"retail_price_cents": serializer.data.get("retail_price_cents")},
        )

        if imported_variant.shopify_variant_id is not None:
            shop = Shop.objects.get_by_user_id(user.id)
        
            update_shopify_variant(
                shop,
                imported_product.shopify_product_id,
                imported_variant.shopify_variant_id,
                {"price": serializer.data.get("retail_price_cents") / 100},
            )

        return Response(
            ImportedVariantSerializer(imported_variant).data, status=status.HTTP_200_OK
        )

class BulkImportedProductListDetail(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'products': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                    description='List of products'
                )
            }
        ),
        responses={200: 'Products updated successfully'}
    )
    def put(self, request):
        user = request.user
        products = request.data.get('products', [])
        update_bulk_imported_products.delay(user.id, products)
        return Response({"message": "Products update task initiated"}, status=status.HTTP_202_ACCEPTED)

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'product_ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                    description='List of product IDs'
                )
            }
        ),
        responses={200: 'Products deleted successfully'}
    )

    def post(self, request):
        user = request.user
        product_ids = request.data.get('product_ids', [])
        delete_bulk_imported_products.delay(user.id, product_ids)
        return Response({"message": "Products delete task initiated"}, status=status.HTTP_202_ACCEPTED)

class OrderList(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "page",
                openapi.IN_QUERY,
                description="Page number",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "order_type",
                openapi.IN_QUERY,
                description="Filter by order type",
                type=openapi.TYPE_STRING,
                enum=["sample_order", "shopify"],
            ),
            openapi.Parameter(
                "search_term",
                openapi.IN_QUERY,
                description="Filter by search term",
                type=openapi.TYPE_STRING,
            )
        ],
        responses={200: OrderSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        page = int(request.GET.get("page", 1))
        order_type = request.GET.get("order_type", "").lower()
        search_term = request.GET.get("search_term")
        status_filter = request.GET.get("status")
        status_tags = status_filter.split(",") if status_filter else None

        orders = Order.get_by_user(user)

        if status_filter:
            conditions = []
            if "processing" in status_tags:
                conditions.append(
                    Q(
                        (Q(sub_orders__status=SubOrderStatus.PROCESSING) | Q(sub_orders__status=SubOrderStatus.PAID)) & 
                        Q(sub_orders__tracking_number__isnull=True) &
                        Q(sub_orders__tracking_link__isnull=True)
                    )
                )

            if "unpaid" in status_tags:
                conditions.append(Q(sub_orders__status=SubOrderStatus.UNPAID))
            
            if "shipped" in status_tags:
                conditions.append(Q(Q(sub_orders__tracking_number__isnull=False) | Q(sub_orders__tracking_link__isnull=False)))
            
            if "cancelled" in status_tags:
                conditions.append(Q(sub_orders__is_cancelled=True))

            orders = orders.filter(reduce(operator.or_, conditions)).distinct()

        if search_term:
            if order_type == "shopify":
                orders = orders.filter(shopify_order_name__icontains=search_term)
            else:
                orders = orders.filter(id=search_term)

        orders = orders.filter(order_type=order_type).order_by("-created_at")

        try:
            paginator = Paginator(orders, 20)
            result = paginator.page(page)
        except EmptyPage:
            return ResponseError.page_is_invalid()

        serializer = OrderSerializer(result, many=True)
        data = serializer.data

        if status_filter:
            for order in data:
                filtered_sub_orders = []

                for sub_order in order["sub_orders"]:
                    if sub_order["status_display"] in status_tags:
                        filtered_sub_orders.append(sub_order)

                order["sub_orders"] = filtered_sub_orders

        response = {
            "total_pages": paginator.num_pages,
            "page": page,
            "data": data,
        }

        return Response(response, status=status.HTTP_200_OK)

class SampleOrder(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=SampleOrderPayloadSerializer,
        responses={200: "message: Product added to a sample order with success"},
    )
    def post(self, request, variant_id):
        user = request.user

        try:
            shop = Shop.objects.get_by_user_id(user.id)
        except Shop.DoesNotExist:
            shop = None

        try:
            variant = ProductVariant.objects.get(id=variant_id)
            subscription = Subscription.objects.filter(
                user=user, status=ActiveStatus.ACTIVE
            ).first()
        except ProductVariant.DoesNotExist:
            return ResponseError.variant_not_found()

        if subscription is None and not settings.DISABLE_PAYMENTS:
            return ResponseError.subscription_not_found()

        # Verify if the shop is allowed to order premium products
        if variant.product.is_premium and not settings.DISABLE_PAYMENTS:
            if subscription.plan.limits.get("premium_products", 0) == 0:
                return ResponseError.premium_product_not_allowed()

        serializer = SampleOrderPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        if serializer.data.get("quantity") == 0:
            return ResponseError.invalid_quantity()

        # Check if already exists a open sub order for this supplier
        product = variant.product
        supplier = product.supplier
        sub_orders = SubOrder.get_by_user(user)

        sub_order = sub_orders.filter(
            status=SubOrderStatus.UNPAID,
            supplier=supplier,
            order__order_type=OrderType.SAMPLE_ORDER,
        ).first()

        if sub_order is None:
            order = Order.objects.create(
                shop=shop, user=user, order_type=OrderType.SAMPLE_ORDER
            )
            sub_order = SubOrder.objects.create(
                shop=shop,
                user=user,
                order=order,
                supplier=supplier,
                total_cost_cents=0,
                shipping_cost_cents=0,
                status=SubOrderStatus.UNPAID,
            )

        # Check if the variant is already in the sub order
        line_item = LineItem.objects.filter(
            sub_order=sub_order, variant_id=variant.id
        ).first()

        if line_item is not None:
            if serializer.data.get("additive"):
                line_item.quantity += serializer.data.get("quantity")
            else:
                line_item.quantity = serializer.data.get("quantity")
            line_item.save()
        else:
            # Add the variant to the sub order
            line_item = LineItem.objects.create(
                sub_order=sub_order,
                product=product,
                variant=variant,
                title=variant.get_composed_title(),
                quantity=serializer.data.get("quantity"),
                sku=variant.sku,
            )

        sub_order.update_costs()
        return Response(
            {"message": "Product added to a sample order with success"},
            status=status.HTTP_200_OK,
        )

    @swagger_auto_schema(
        responses={200: "message: Product removed from the sample order with success"}
    )
    def delete(self, request, variant_id):
        user = request.user
        sub_orders = SubOrder.get_by_user(user)

        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return ResponseError.variant_not_found()

        # Check if already exists a open sub order for this supplier
        supplier = variant.product.supplier
        sub_order = sub_orders.filter(
            status=SubOrderStatus.UNPAID,
            supplier_id=supplier.id,
            order__order_type=OrderType.SAMPLE_ORDER,
        ).first()

        if sub_order is None:
            return ResponseError.suborder_not_found()

        LineItem.objects.filter(sub_order=sub_order, variant_id=variant.id).delete()

        # If the sub order has no line items, delete the order
        total_line_items = sub_order.line_items.count()

        if total_line_items == 0:
            sub_order.order.delete()
        else:
            sub_order.update_costs()

        return Response(
            {"message": "Product removed from the sample order with success"},
            status=status.HTTP_200_OK,
        )


class UpdateOrderAddress(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=AddressPayloadSerializer,
        responses={200: "message: Address and customer data updated with success"},
    )
    def put(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return ResponseError.order_not_found()

        serializer = AddressPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        # Update or create the customer
        customer = order.customer
        if customer is None:
            customer = Customer.objects.create(
                first_name=serializer.data.get("first_name"),
                last_name=serializer.data.get("last_name"),
            )
            order.customer = customer
        else:
            customer.first_name = serializer.data.get("first_name")
            customer.last_name = serializer.data.get("last_name")
            customer.save()

        # Update or create the address
        address = order.shipping_address
        previous_address = address
        if address is None:
            address = Address.objects.create(
                line_1=serializer.data.get("line_1"),
                line_2=serializer.data.get("line_2"),
                city=serializer.data.get("city"),
                state=serializer.data.get("state"),
                country=serializer.data.get("country"),
                zip=serializer.data.get("zip"),
                phone=serializer.data.get("phone"),
            )
            order.shipping_address = address
        else:
            address.line_1 = serializer.data.get("line_1")
            address.line_2 = serializer.data.get("line_2")
            address.city = serializer.data.get("city")
            address.state = serializer.data.get("state")
            address.country = serializer.data.get("country")
            address.zip = serializer.data.get("zip")
            address.phone = serializer.data.get("phone")
            address.save()

        order.save()

        def undo_address():
            order.shipping_address = previous_address
            order.save()
            if previous_address is None:
                address.delete()


        for sub_order in order.sub_orders.all():
            try:
                sub_order.update_costs(check_if_accepts_worldwide_shipping=True)
            except ShippingCountryRequiredException:
                undo_address()
                return ResponseError.country_is_required()
            except ShippingNotAvailableException:
                undo_address()
                return ResponseError.shipping_not_available()

        return Response(
            {"message": "Address and customers updated with success"},
            status=status.HTTP_200_OK,
        )


class DropshippingSettings(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: DropshipSettingsSerializer()})
    def get(self, request):
        user = request.user
        shop = None
        try:
            shop = Shop.objects.get_by_user_id(user.id)
            dropshipping_settings = DropshipSettings.objects.filter(
                Q(shop=shop) | Q(user=user)
            ).first()
        except Shop.DoesNotExist:
            dropshipping_settings = DropshipSettings.objects.filter(user=user).first()

        if dropshipping_settings is None:
            dropshipping_settings = create_dropship_settings(user, shop)

        serializer = DropshipSettingsSerializer(dropshipping_settings)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=DropshipSettingsPayloadSerializer,
        responses={200: DropshipSettingsPayloadSerializer()},
    )
    def post(self, request):
        user = request.user
        shop = None

        try:
            shop = Shop.objects.get_by_user_id(user.id)
            settings = DropshipSettings.objects.filter(
                Q(shop=shop) | Q(user=user)
            ).first()
        except Shop.DoesNotExist:
            settings = DropshipSettings.objects.filter(user=user).first()
        
        # "Delete" the images from the settings if the user sends 0
        if request.data.get('brand_logo') == 0:
            request.data['brand_logo'] = None

        if request.data.get('invoice_logo') == 0:
            request.data['invoice_logo'] = None

        if request.data.get('products_background_color'):
            subscription = Subscription.objects.filter(user=user, status=ActiveStatus.ACTIVE).first()
            if subscription is None:
                return ResponseError.subscription_not_found()
            
            if not subscription.plan.limits.get('customized_product_image_background'):
                return ResponseError.customized_background_not_allowed()

        serializer = DropshipSettingsPayloadSerializer(settings, data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubOrderCheckout(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: "message: Sub order paid with success"})
    def post(self, request, sub_order_id):
        user = request.user
        sub_order = SubOrder.get_by_user(user)

        sub_order = sub_order.filter(id=sub_order_id).first()
        if sub_order is None:
            return ResponseError.suborder_not_found()

        inactive_line_items = sub_order.line_items.filter(Q(product__is_active=False) | Q(product__supplier__is_active=False))

        if inactive_line_items.exists():
            inactive_product_titles = inactive_line_items.values_list("product__title", flat=True)
            return ResponseError.suborder_has_inactive_products(inactive_product_titles)

        subscription = Subscription.objects.filter(
            user=user, status=ActiveStatus.ACTIVE
        ).first()
        if subscription is None and not settings.DISABLE_PAYMENTS:
            return ResponseError.subscription_not_found()

        payment_method_id = user.stripe_payment_method_id

        if payment_method_id is None:
            return ResponseError.payment_method_not_found()

        if sub_order.status == SubOrderStatus.PAID:
            return ResponseError.suborder_already_paid()

        if sub_order.order.shipping_address is None:
            return ResponseError.address_not_found()

        try:
            sub_order.update_costs(check_if_accepts_worldwide_shipping=True)
        except ShippingCountryRequiredException:
            return ResponseError.country_is_required()
        except ShippingNotAvailableException:
            return ResponseError.shipping_not_available()

        amount_cents = sub_order.total_cost_cents + sub_order.shipping_cost_cents
        transaction_fee = int(sub_order.get_transaction_fee())
        description = f"#{sub_order.id} {sub_order.supplier.name}"

        if sub_order.order.order_type == OrderType.SAMPLE_ORDER:
            return_url = f"{settings.FRONTEND_URL}/sample-orders"
        else:
            return_url = f"{settings.FRONTEND_URL}/orders"

        if sub_order.supplier.bank_account:
            payment_intent, error = create_one_time_payment_with_transfer(
                amount_cents + transaction_fee,
                description[:22],
                user.name,
                payment_method_id,
                user,
                sub_order.supplier.bank_account,
                amount_cents,
                return_url,
            )
        else:
            payment_intent, error = create_stripe_charge(
                amount_cents + transaction_fee,
                description[:22],
                user.name,
                payment_method_id,
                user,
                return_url,
            )

        if error:
            logger.error(error)
            return ResponseError.payment_intent_failed()

        sub_order.status = SubOrderStatus.PROCESSING
        sub_order.stripe_payment_intent_id = payment_intent.id
        sub_order.save()

        return Response(
            {"message": "Sub order paid with success"}, status=status.HTTP_200_OK
        )


def invoice_view(request, sub_order_id):
    """
    This view is used to generate the invoice for the sub order
    """
    try:
        sub_order = SubOrder.objects.get(id=sub_order_id)
    except SubOrder.DoesNotExist:
        return render(request, "error.html", {"error": "Sub order not found"})

    sub_order_serialized = SubOrderSerializer(sub_order).data
    customer = CustomerSerializer(sub_order.order.customer).data

    if sub_order.shop:
        dropshipping_settings = DropshipSettings.objects.filter(Q(shop=sub_order.shop) | Q(user=sub_order.shop.owner)).first()
    else:
        dropshipping_settings = DropshipSettings.objects.filter(user=sub_order.user).first()
        
    if dropshipping_settings is None:
        dropshipping_settings = create_dropship_settings(
            sub_order.user, sub_order.shop
        )

    # Calculate the sub total and total
    if sub_order.order.order_type == OrderType.SHOPIFY:
        # If it's a Shopify order, use 'shopify_price_cents' for the total
        total = 0
        for line_item in sub_order_serialized["line_items"]:
            total += line_item["shopify_price_cents"] * line_item["quantity"]
        sub_total = total
    else:
        # If it's not a Shopify order, calculate the sub total and total as before
        sub_total = sub_order_serialized["total_cost_cents"]
        total = (
            sub_total
            + sub_order_serialized["transaction_fee"]
            + sub_order_serialized["shipping_cost_cents"]
        )

    line_items = []

    # Looping line items to format and calculate cost and total
    for line_item in sub_order_serialized["line_items"]:
        cost = (
            line_item["shopify_price_cents"]
            if sub_order.order.order_type == OrderType.SHOPIFY
            else line_item["cost_cents"]
        )
        totalLineItem = (
            line_item["shopify_price_cents"] * line_item["quantity"]
            if sub_order.order.order_type == OrderType.SHOPIFY
            else line_item["total_cost_cents"]
        )
        line_items.append(
            {
                "title": line_item["title"],
                "quantity": line_item["quantity"],
                "cost": "${:,.2f}".format(cost / 100),
                "total": "${:,.2f}".format(totalLineItem / 100),
            }
        )

    # Create the context for the invoice
    context = {
        "date_issued": sub_order.created_at.strftime("%Y-%m-%d"),
        "invoice_no": sub_order.order.shopify_order_name[1:]
        if sub_order.order.shopify_order_name
        else 1001 + sub_order.id,
        "ship_to_address": AddressSerializer(sub_order.order.shipping_address),
        "line_items": line_items,
        "transaction_fee": 0
        if sub_order.order.shopify_order_name
        else "${:,.2f}".format(sub_order_serialized["transaction_fee"] / 100),
        "shipping_cost": 0
        if sub_order.order.shopify_order_name
        else "${:,.2f}".format(sub_order_serialized["shipping_cost_cents"] / 100),
        "sub_total": "${:,.2f}".format(sub_total / 100),
        "total": "${:,.2f}".format(total / 100),
        "customer_name": customer.get("first_name") + " " + customer.get("last_name"),
        "logo": dropshipping_settings.invoice_logo.url
        if dropshipping_settings.invoice_logo
        else None,
        "store_name": dropshipping_settings.invoice_store_name,
        "contact_email": dropshipping_settings.invoice_contact_email,
        "website": dropshipping_settings.invoice_website,
        "notes": dropshipping_settings.invoice_body,
    }

    return render(request, "invoice.html", context)


def invoice_preview_view(request, user_id):
    """
    This view is used to generate the invoice for the sub order
    """

    try:
        shop = Shop.objects.get_by_user_id(user_id)
        dropshipping_settings = DropshipSettings.objects.filter(
            Q(shop=shop) | Q(user=user_id)
        ).first()
    except Shop.DoesNotExist:
        dropshipping_settings = DropshipSettings.objects.filter(user=user_id).first()

    if dropshipping_settings is None:
        dropshipping_settings = create_dropship_settings(
            user_id, shop
        )

    total = 180

    line_items = [
        {
            "title": "The Infinity Lamp",
            "quantity": 3,
            "cost": "${:,.2f}".format(10),
            "total": "${:,.2f}".format(30),
        },
        {
            "title": "Mystic Morning Coffee Maker",
            "quantity": 1,
            "cost": "${:,.2f}".format(90),
            "total": "${:,.2f}".format(90),
        },
        {
            "title": "EchoBass Wireless Headphones",
            "quantity": 2,
            "cost": "${:,.2f}".format(30),
            "total": "${:,.2f}".format(60),
        },
    ]

    fake_address = {
        "line_1": "150 Elgin St",
        "line_2": "8th Floor",
        "city": "Ottawa",
        "state": "Ontario",
        "country": "Canada",
        "zip": "K2P 1L4",
        "phone": "+1 613-555-0195",
    }
    # Create the context for the invoice
    context = {
        "date_issued": datetime.now().strftime("%Y-%m-%d"),
        "invoice_no": 1001,
        "ship_to_address": AddressSerializer(fake_address),
        "line_items": line_items,
        "transaction_fee": 0,
        "shipping_cost": 0,
        "sub_total": "${:,.2f}".format(total),
        "total": "${:,.2f}".format(total),
        "customer_name": "Ethan Tremblay",
        "logo": dropshipping_settings.invoice_logo.url
        if dropshipping_settings.invoice_logo
        else None,
        "store_name": dropshipping_settings.invoice_store_name,
        "contact_email": dropshipping_settings.invoice_contact_email,
        "website": dropshipping_settings.invoice_website,
        "notes": dropshipping_settings.invoice_body,
    }

    return render(request, "invoice.html", context)


class FulfillmentOrder(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={200: "message: Fulfillment scheduled to be sent to Shopify"}
    )
    def post(self, request, sub_order_id):
        user = request.user

        try:
            shop = Shop.objects.get_by_user_id(user.id)
            sub_order = SubOrder.objects.get(id=sub_order_id, shop=shop)
        except Shop.DoesNotExist:
            return ResponseError.shop_not_found()
        except SubOrder.DoesNotExist:
            return ResponseError.suborder_not_found()

        if sub_order.status != SubOrderStatus.PAID:
            return ResponseError.suborder_not_paid()

        if sub_order.order.shopify_order_id is None:
            return ResponseError.allowed_only_for_shopify_orders()

        fulfillment_order_id, _ = get_fulfillment_order(
            shop, sub_order.order.shopify_order_id
        )

        if fulfillment_order_id is None:
            return ResponseError.fulfillment_order_not_found()

        create_fulfillment_for_subOrder.delay(sub_order_id)
        return Response(
            {"message": "Fulfillment scheduled to be sent to Shopify"},
            status=status.HTTP_200_OK,
        )


class SidebarCountLiveProducts(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: "count: Number of live products"})
    def get(self, request):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)
        count = imported_products.filter(is_live=True).count()

        return Response({"count": count}, status=status.HTTP_200_OK)


class SidebarCountImportedProducts(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: "count: Number of imported products"})
    def get(self, request):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)

        count = imported_products.filter(is_live=False).count()

        return Response({"count": count}, status=status.HTTP_200_OK)


class SidebarCountSampleOrders(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: "count: Number of sample orders"})
    def get(self, request):
        user = request.user
        orders = SubOrder.get_by_user(user)

        count = orders.filter(
            order__order_type=OrderType.SAMPLE_ORDER,
            status=SubOrderStatus.UNPAID,
        ).count()

        return Response({"count": count}, status=status.HTTP_200_OK)


class SidebarCountShopifyOrders(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: "count: Number of shopify orders"})
    def get(self, request):
        user = request.user

        try:
            shop = Shop.objects.get_by_user_id(user.id)
            count = SubOrder.objects.filter(
                shop=shop,
                order__order_type=OrderType.SHOPIFY,
                status=SubOrderStatus.UNPAID,
            ).count()
        except Shop.DoesNotExist:
            return ResponseError.shop_not_found()

        return Response({ "count": count }, status=status.HTTP_200_OK)

def branded_product_editor_view(request):
    """
        This view is used to render the branded product editor
    """
    refresh = RefreshToken.for_user(request.user)
    return render(request, 'branded-product-editor.html', { 'access_token': str(refresh.access_token), 'refresh_token': str(refresh)})

class BrandSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={200: "message: Brand settings updated with success" }
    )
    def put(self, request, variant_id):
        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return ResponseError.variant_not_found()

        serializer = BrandSettingsSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)
        serializer.save()
        variant.brand_settings = serializer.instance
        variant.save()

        # imported_variants = ImportedVariant.objects.filter(variant=variant)
        # for variant in imported_variants:
        #     generate_branded_image_for_variant.delay(variant.id)
            
        return Response({ "message": "Brand settings updated with success" }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        responses={200: BrandSettingsSerializer }
    )
    def get(self, request, variant_id):
        try:
            variant = ProductVariant.objects.get(id=variant_id)
            brand_settings = BrandSettings.objects.get(id=variant.brand_settings_id)
        except BrandSettings.DoesNotExist:
            return ResponseError.brand_settings_not_found()
        except ProductVariant.DoesNotExist:
            return ResponseError.variant_not_found()
        
        serializer = BrandSettingsSerializer(brand_settings)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        responses={200: "message: Brand settings deleted with success" }
    )
    def delete(self, request, variant_id):
        try:
            variant = ProductVariant.objects.get(id=variant_id)
            brand_settings = BrandSettings.objects.get(id=variant.brand_settings_id)
        except BrandSettings.DoesNotExist:
            return ResponseError.brand_settings_not_found()
        except ProductVariant.DoesNotExist:
            return ResponseError.variant_not_found()
        
        brand_settings.delete()
        return Response({ "message": "Brand settings deleted with success" }, status=status.HTTP_200_OK)

def create_dropship_settings(user, shop):
    dropshipping_settings = DropshipSettings.objects.create(user=user, shop=shop)

    if shop is not None:
        # Get the shop details and set the invoice store name, contact email, and website
        shop_details = get_shop_details(shop)
        dropshipping_settings.invoice_store_name = shop_details["name"]
        dropshipping_settings.invoice_contact_email = shop_details["contactEmail"]
        dropshipping_settings.invoice_website = shop_details["primaryDomain"]["host"]
        dropshipping_settings.save()

    return dropshipping_settings
class CancelSuborder(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: "message: Sub order canceled with success"})
    def post(self, request, sub_order_id):
        user = request.user
        sub_order = SubOrder.get_by_user(user)

        sub_order = sub_order.filter(id=sub_order_id).first()
        if sub_order is None:
            return ResponseError.suborder_not_found()

        if sub_order.status != SubOrderStatus.UNPAID:
            return ResponseError.suborder_not_unpaid()

        sub_order.is_cancelled = True
        sub_order.save()

        return Response(
            {"message": "Sub order canceled with success"}, status=status.HTTP_200_OK
        )


class CreateProductAssets(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=ProductAssetPayloadSerializer,
        responses={200: ProductAssetPayloadSerializer()},
    )
    def post(self, request):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)
        product_id = request.data.get("product")

        try:
            imported_products.get(product_id=product_id)
        except ImportedProduct.DoesNotExist:
            return ResponseError.product_not_found()

        serializer = ProductAssetPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductAssetsDetails(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=ProductAssetPayloadSerializer,
        responses={200: ProductAssetPayloadSerializer()},
    )
    def put(self, request, asset_id):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)
        product_id = request.data.get("product")

        try:
            imported_products.get(product_id=product_id)
        except Product.DoesNotExist:
            return ResponseError.product_not_found()

        asset = ProductAsset.objects.get(id=asset_id)
        serializer = ProductAssetPayloadSerializer(asset, data=request.data)

        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(responses={200: "message: Asset deleted"})
    def delete(self, request, asset_id):
        user = request.user
        imported_products = ImportedProduct.get_by_user(user)
        asset = ProductAsset.objects.get(id=asset_id)

        try:
            imported_products.get(product_id=asset.product_id)
        except ImportedProduct.DoesNotExist:
            return ResponseError.product_not_found()

        asset.delete()

        return Response({"message": "Asset deleted"}, status=status.HTTP_200_OK)


class BulkUpdateImportedVariant(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'product_id': openapi.TYPE_INTEGER,
                'variants': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'id': openapi.TYPE_INTEGER,
                            'imported_variant_id': openapi.TYPE_INTEGER,
                            'is_active': openapi.TYPE_BOOLEAN,
                        }
                    ),
                    description='List of imported variants'
                )
            }
        ),
        responses={200: 'message: Variants updated successfully'}
    )
    def post(self, request):
        user = request.user
        product_id = request.data.get("product_id")
        variants = request.data.get("variants")
    
        sync_product_variants.delay(user.id, product_id, variants)

        return Response({"message": "Variants updated successfully"}, status=status.HTTP_200_OK)


class GetBulkCheckoutSummary(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={200: "subtotal: Subtotal, shipping_cost: Shipping cost, transaction_fee: Transaction fee, total: Total"}
    )
    def get(self, request):
        user = request.user
        ids = request.GET.get("ids", "").split(",")
        order_type = request.GET.get("order_type")
        sub_orders = SubOrder.get_by_user(user)

        if not ids == "":
            sub_orders = sub_orders.filter(status=SubOrderStatus.UNPAID, order__order_type=order_type, is_cancelled=False)
        else:
            sub_orders = sub_orders.filter(status=SubOrderStatus.UNPAID, order__id__in=ids)

        if not sub_orders.exists():
            return ResponseError.suborder_not_found()

        subtotal = 0
        total_shipping_cost = 0
        total_transaction_fee = 0
        total = 0
        line_items = []
        sub_order_ids = []

        for sub_order in sub_orders:
            if sub_order.order.shipping_address is None:
                continue

            sub_order_ids.append(sub_order.id)
            subtotal += sub_order.total_cost_cents
            total_shipping_cost += sub_order.shipping_cost_cents
            amount_cents = sub_order.total_cost_cents + sub_order.shipping_cost_cents
            transaction_fee = int(sub_order.get_transaction_fee())
            total_transaction_fee += transaction_fee
            total += amount_cents + transaction_fee

            for line_item in sub_order.line_items.all():
                line_items.append(LineItemSerializer(line_item).data)

        if sub_order_ids == []:
            return ResponseError.suborder_not_found()

        return Response(
            {
                "subtotal": subtotal,
                "shipping_cost": total_shipping_cost,
                "transaction_fee": total_transaction_fee,
                "total": total,
                "line_items": line_items,
                "sub_order_ids": sub_order_ids,
            },
            status=status.HTTP_200_OK,
        )
