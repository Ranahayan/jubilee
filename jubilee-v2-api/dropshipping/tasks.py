from time import sleep
from celery import shared_task
from authentication.models import Shop, CustomUser
from dropshipping.errors import ShopifyProductNotFoundError
import pyactiveresource.connection
from dropshipping.email import send_mass_deactivated_product_email
from dropshipping.helpers import batched
from .models import (
    ImportedVariant,
    DropshipSettings,
    ImportedProduct,
    LineItem,
    ProductVariant,
    SubOrder,
    BrandType,
    ProductShipping,
    Order,
    Customer,
    OrderType,
    SubOrderStatus,
    Address
)
from .services import ImportedProductService, create_fulfillment, get_fulfillment_order, get_location_id, inventory_bulk_adjust_quantity, update_shopify_product, add_media_to_product, update_shopify_variant, create_shopify_variant, get_variant_data, replace_all_media, delete_shopify_variant, delete_shopify_product
from .serializers import VariantSerializer
from django.conf import settings
from django.db.models import Q
from itertools import groupby
from .image_utils import generate_branded_image
from dropshipping.errors import ShopifyProductNotFound
from dropshipping.email import send_mass_deactivated_product_email
from dropshipping.helpers import batched
from channels.layers import get_channel_layer
import shopify
from asgiref.sync import async_to_sync
from .notifications import (
    send_line_item_country_not_supported_notification,
    send_suborder_not_accepted_notification,
)
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


SQS_QUEUE_PREFIX_IMAGE_GENERATION = settings.SQS_QUEUE_PREFIX_IMAGE_GENERATION

@shared_task
def trigger_stock_refresh():
    """
        Create new tasks for each shop to update the inventory in Shopify.
    """
    if not settings.INVENTORY_MANAGEMENT:
        return

    shops = Shop.objects.filter(
        is_active=True,
        imported_products__shopify_product_id__isnull=False
    ).distinct()

    for shop in shops:
        sync_shop_inventory_in_shopify.delay(shop.id)

    return f"Scheduled inventory update for {shops.count()} shops"


@shared_task
def accept_fulfillment_request_for_sub_order(sub_order_id):
    """
    Prepare a suborder for fulfillment by setting placeholder tracking details,
    then trigger fulfillment creation. This mirrors the working app's flow.
    """
    try:
        suborder = SubOrder.objects.get(id=sub_order_id)
    except SubOrder.DoesNotExist:
        logger.warning(f"[FULFILLMENT_TASK] SubOrder not found for id={sub_order_id}")
        return "SubOrder not found"

    # Set placeholder tracking data (avoid signals by using update)
    SubOrder.objects.filter(id=sub_order_id).update(
        tracking_number=str(sub_order_id),
        tracking_link="https://jubilee.ai/track-products",
        tracking_carrier="Jubilee"
    )

    # Refresh instance
    suborder.refresh_from_db()
    
    # Skip if unpaid or refunded
    if suborder.status in [SubOrderStatus.UNPAID, SubOrderStatus.REFUNDED]:
        logger.info(f"[FULFILLMENT_TASK] Skipping fulfillment for sub_order_id={sub_order_id} due to status={suborder.status}")
        return f"Skipped due to status {suborder.status}"

    try:
        create_fulfillment_for_subOrder.delay(sub_order_id)
    except Exception as e:
        logger.exception(f"[FULFILLMENT_TASK] Error queueing fulfillment creation for sub_order_id={sub_order_id}: {e}")
        raise e

    return "Queued fulfillment creation"





@shared_task
def sync_shop_inventory_in_shopify(shop_id):
    """
        Synchronize the inventory of the store on Shopify with the available stock for 
        each variant in our database.
    """
    shop = Shop.objects.get(id=shop_id)

    imported_variants = ImportedVariant.objects.filter(
        shopify_variant_id__isnull=False,
    )

    shop_settings = DropshipSettings.objects.filter(shop_id=shop_id).first()
    location_id = shop_settings.shopify_location_id

    inventories = []

    for imported_variant in imported_variants:
        if imported_variant.shopify_available_quantity != imported_variant.variant.inventory_quantity:
            inventories.append({
                "inventoryItemId": imported_variant.shopify_inventory_item_id,
                "availableDelta": imported_variant.variant.inventory_quantity - imported_variant.shopify_available_quantity,
                "locationId": location_id,
            })
    
    if len(inventories) == 0:
        return f"No inventory updates for shop {shop_id}"

    inventory_levels = inventory_bulk_adjust_quantity(shop, inventories)
    
    for inventory_level in inventory_levels:
        imported_variant = imported_variants.get(shopify_inventory_level_id=inventory_level['id'])
        imported_variant.shopify_available_quantity = inventory_level['available']
        imported_variant.save()
    
    return f"{len(inventories)} variant(s) updated for shop {shop_id}"


@shared_task
def trigger_product_update(product_id, fields, delete=False):
    """
        Create new tasks for each shop to update the products in Shopify.
    """
    shops = Shop.objects.filter(
        is_active=True,
        imported_products__product_id=product_id,
        imported_products__shopify_product_id__isnull=False
    ).distinct()

    for shop in shops:
        if delete:
            sync_delete_product_in_shopify.delay(shop.id, product_id)
        else:
            sync_product_in_shopify.delay(shop.id, product_id, fields)

    return f"Scheduled product update for {shops.count()} shops"


@shared_task
def sync_delete_product_in_shopify(shop_id, product_id):
    """
        Synchronize the product deletion in Shopify
    """
    imported_product = ImportedProduct.objects.filter(
        shop_id=shop_id,
        product_id=product_id,
    ).first()

    shop = Shop.objects.get(id=shop_id)
    product = imported_product.product

    if imported_product.shopify_product_id:
        delete_shopify_product(shop, imported_product.shopify_product_id)

    imported_product.delete()
    return f"Product '{product.title}' deleted for shop {shop.url}"


@shared_task
def sync_product_in_shopify(shop_id, product_id, fields):
    """
        Synchronize the product in Shopify with the product in our database.
    """
    imported_product = ImportedProduct.objects.filter(
        shop_id=shop_id,
        product_id=product_id,
        shopify_product_id__isnull=False
    ).first()  

    shop = Shop.objects.get(id=shop_id)
    product = imported_product.product
    payload = {}
    # Remap the fields to match the Shopify API
    remap_fields = { "description": "descriptionHtml" }

    for field in fields:
        payload[remap_fields.get(field, field)] = getattr(product, field)

    try:
        update_shopify_product(shop, imported_product.shopify_product_id, payload)
    except ShopifyProductNotFoundError:
        imported_product.shopify_product_id = None
        imported_product.is_live = False
        imported_product.live_at = None
        imported_product.save()
        return f"Product '{product}' not found in Shopify for shop {shop.url}"

    return f"Product '{product}' updated for shop {shop.url}"


@shared_task(queue=SQS_QUEUE_PREFIX_IMAGE_GENERATION)
def trigger_product_asset_update(product_id, media = None):
    """
        Create new tasks for each shop to update the product images in Shopify.

        If media is not None then it will be added to the product, otherwise all the
        images will be deleted and then added again.
    """
    shops = Shop.objects.filter(
        is_active=True,
        imported_products__product_id=product_id,
        imported_products__shopify_product_id__isnull=False
    ).distinct()

    for shop in shops:
        sync_product_assets_in_shopify.delay(shop.id, product_id, media)

    return f"Scheduled product asset update for {shops.count()} shops"


@shared_task(queue=SQS_QUEUE_PREFIX_IMAGE_GENERATION)
def sync_product_assets_in_shopify(shop_id, product_id, media = None):
    """
        Synchronize the product images in Shopify with the product in our database.
    """
    imported_product = ImportedProduct.objects.filter(
        shop_id=shop_id,
        product_id=product_id,
        shopify_product_id__isnull=False
    ).first()

    if not imported_product:
        return f"Product {product_id} not found for shop {shop_id}"

    shop = Shop.objects.get(id=shop_id)
    product = imported_product.product

    if media is not None:
        add_media_to_product(shop, imported_product.shopify_product_id, [media])
    else:
       replace_all_media(shop, imported_product)
    
    return f"Product '{product.title}' images updated for shop {shop.url}"


@shared_task
def trigger_variant_update(variant_id, skip_media_update):
    """
        Create new tasks for each shop to update the product variant in Shopify.
    """

    variant = ProductVariant.objects.get(id=variant_id)

    shops = Shop.objects.filter(
        is_active=True,
        imported_products__product_id=variant.product.id,
        imported_products__shopify_product_id__isnull=False
    ).distinct()

    for shop in shops:
            sync_variant_in_shopify.delay(shop.id, variant_id, skip_media_update)

    return f"Scheduled variant update for {shops.count()} shops"

shop_id, variant_id, skip_media_update = 643834, 500, True
@shared_task
def sync_variant_in_shopify(shop_id, variant_id, skip_media_update = False):
    """
        Synchronize the product variant in Shopify with the product variant in our database.
    """
    try:
        shop = Shop.objects.get(id=shop_id)
        variant = ProductVariant.objects.get(id=variant_id)
        imported_product = ImportedProduct.objects.get(product_id=variant.product.id, shop_id=shop.id)
        imported_variant = ImportedVariant.objects.filter(variant_id=variant_id, imported_product=imported_product).first()
        shopify_product_id = imported_product.shopify_product_id

        if imported_variant is None:
            imported_variant = ImportedVariant.objects.create(
                variant_id=variant_id,
                imported_product=imported_product
            )

        if imported_variant.shopify_variant_id is None:
            if variant.image and not skip_media_update:
                add_media_to_product(shop, shopify_product_id, [variant.image.url])

            data = create_shopify_variant(shop, shopify_product_id, VariantSerializer(variant).data)
            # Save the Shopify data for future updates
            imported_variant.shopify_variant_id = data["id"]
            imported_variant.shopify_inventory_item_id = data["inventory_item_id"]
            imported_variant.shopify_inventory_level_id = data["inventory_level_id"]
            imported_variant.shopify_available_quantity = variant.inventory_quantity
            imported_variant.save()
        else:
            if not skip_media_update:
                replace_all_media(shop, imported_product)

            location_id = get_location_id(shop)
            variant_data = get_variant_data(VariantSerializer(variant).data, location_id)
            if "inventoryQuantities" in variant_data:
                del variant_data["inventoryQuantities"]
            update_shopify_variant(
                shop, 
                imported_product.shopify_product_id, 
                imported_variant.shopify_variant_id, 
                variant_data
            )

        return f"Variant '{variant.get_composed_title()}' updated for shop {shop.url}"
    except Exception as e:
        logger.exception(e)
        raise e


@shared_task
def trigger_variant_delete(variant_id):
    """
        Create new tasks for each shop to delete the product variant in Shopify.
    """
    variant = ProductVariant.objects.get(id=variant_id)

    shops = Shop.objects.filter(
        is_active=True,
        imported_products__product_id=variant.product.id,
        imported_products__shopify_product_id__isnull=False
    ).distinct()

    for shop in shops:
        sync_delete_variant_in_shopify.delay(shop.id, variant_id)

    return f"Scheduled variant delete for {shops.count()} shops"


@shared_task
def sync_delete_variant_in_shopify(shop_id, variant_id):
    """
        Synchronize the product variant deletion in Shopify
    """
    shop = Shop.objects.get(id=shop_id)
    variant = ProductVariant.objects.get(id=variant_id)
    imported_product = ImportedProduct.objects.get(product_id=variant.product.id, shop_id=shop.id)
    imported_variant = ImportedVariant.objects.filter(variant_id=variant_id, imported_product=imported_product).first()
    shopify_variant_id = imported_variant.shopify_variant_id
    
    if shopify_variant_id:
        delete_shopify_variant(shop, shopify_variant_id, product_id=shopify_variant_id)

    imported_variant.delete()
    return f"Variant {variant.get_composed_title()} deleted for shop {shop.url}"


@shared_task
def create_fulfillment_for_subOrder(sub_order_id):
    logger.info(f"[FULFILLMENT_TASK] Starting fulfillment creation task for sub_order_id: {sub_order_id}")
    
    try:
        sub_order = SubOrder.objects.get(id=sub_order_id)
    except SubOrder.DoesNotExist:
        logger.error(f"[FULFILLMENT_TASK] SubOrder not found for id: {sub_order_id}")
        return "SubOrder not found"
        
    shop = sub_order.shop
    if not sub_order.order:
        logger.error(f"[FULFILLMENT_TASK] No order associated with sub_order_id: {sub_order_id}")
        return "No order associated with suborder"
        
    shopify_order_id = sub_order.order.shopify_order_id
    if not shopify_order_id:
        logger.error(f"[FULFILLMENT_TASK] No shopify_order_id for sub_order_id: {sub_order_id}")
        return "No shopify_order_id found"
    
    logger.info(f"[FULFILLMENT_TASK] SubOrder details - shop: {shop.url if shop else 'None'}, shopify_order_id: {shopify_order_id}")
    logger.info(f"[FULFILLMENT_TASK] Tracking info - carrier: {sub_order.tracking_carrier}, number: {sub_order.tracking_number}")

    if not sub_order.tracking_carrier and not sub_order.tracking_number:
        logger.warning(f"[FULFILLMENT_TASK] Proceeding without tracking info for sub_order_id: {sub_order_id}")

    logger.info(f"[FULFILLMENT_TASK] Getting fulfillment order for shopify_order_id: {shopify_order_id}")
    fulfillment_order_id, fulfillment_line_items = get_fulfillment_order(shop, shopify_order_id)
    logger.info(f"[FULFILLMENT_TASK] Fulfillment order result - order_id: {fulfillment_order_id}, line_items_count: {len(fulfillment_line_items) if fulfillment_line_items else 0}")

    if fulfillment_order_id is None:
        logger.warning(f"[FULFILLMENT_TASK] No open fulfillment orders found for shopify_order_id: {shopify_order_id}")
        return "No open fulfillment orders found"

    line_item_ids = []
    sub_order_line_items = LineItem.objects.filter(sub_order_id=sub_order_id)
    logger.info(f"[FULFILLMENT_TASK] Found {sub_order_line_items.count()} line items for sub_order_id: {sub_order_id}")
    
    line_items_by_sku = {line_item.variant.sku: line_item for line_item in sub_order_line_items}
    line_items_by_title = {line_item.product.title: line_item for line_item in sub_order_line_items}
    
    logger.info(f"[FULFILLMENT_TASK] Line items by SKU: {list(line_items_by_sku.keys())}")
    logger.info(f"[FULFILLMENT_TASK] Line items by title: {list(line_items_by_title.keys())}")

    for line_item in fulfillment_line_items:
        logger.info(f"[FULFILLMENT_TASK] Processing fulfillment line item - SKU: {line_item.get('sku')}, title: {line_item.get('productTitle')}")
        if line_item["sku"] in line_items_by_sku or line_item["productTitle"] in line_items_by_title:
            line_item_ids.append({
                "id": line_item["id"],
                "quantity": line_item["totalQuantity"]
            })
            logger.info(f"[FULFILLMENT_TASK] Added line item to fulfillment - ID: {line_item['id']}, quantity: {line_item['totalQuantity']}")

    logger.info(f"[FULFILLMENT_TASK] Final line item IDs for fulfillment: {line_item_ids}")
    if not line_item_ids:
        # Fallback: if nothing matched by SKU/title, fulfill all items in the fulfillment order
        logger.warning(f"[FULFILLMENT_TASK] No line items matched by SKU/title. Falling back to fulfill all items for fulfillment_order_id: {fulfillment_order_id}")
        for li in fulfillment_line_items or []:
            line_item_ids.append({"id": li["id"], "quantity": li["totalQuantity"]})
        logger.info(f"[FULFILLMENT_TASK] Fallback line item IDs: {line_item_ids}")
    logger.info(f"[FULFILLMENT_TASK] Calling create_fulfillment for sub_order_id: {sub_order_id}")
    
    try:
        create_fulfillment(shop, fulfillment_order_id, sub_order_id, line_item_ids)
        logger.info(f"[FULFILLMENT_TASK] Successfully created fulfillment for sub_order_id: {sub_order_id}")
    except Exception as e:
        logger.error(f"[FULFILLMENT_TASK] Error creating fulfillment for sub_order_id {sub_order_id}: {str(e)}")
        raise
    
    logger.info(f"[FULFILLMENT_TASK] Completed fulfillment creation task for sub_order_id: {sub_order_id}")

@shared_task(queue=SQS_QUEUE_PREFIX_IMAGE_GENERATION)
def trigger_brand_images_generation():
    imported_variants = ImportedVariant.objects.filter(
        image__isnull=True,
        variant__product__branding_type__in=[BrandType.BRAND_NAME, BrandType.BRAND_LOGO]
    )

    for i, imported_variant in enumerate(imported_variants):
        cache_key = f"generate-branded-image-for-imported-variant-{imported_variant.id}"
        if cache.get(cache_key):
            continue
        cache.set(cache_key, "processing", timeout=settings.BRANDED_IMAGE_GENERATION_TTL)
        generate_branded_image_for_variant.apply_async(
            args=[imported_variant.id],
            kwargs={"skip_shopify_update": True},
            countdown=i * 10
        )

    return f"Scheduled branded image generation for {imported_variants.count()} imported variants"

@shared_task(queue=SQS_QUEUE_PREFIX_IMAGE_GENERATION, rate_limit='7/m')
def generate_branded_image_for_variant(imported_variant_id, skip_shopify_update=False):
    imported_variant = ImportedVariant.objects.filter(id=imported_variant_id).first()
    if imported_variant is None:
        return f"Imported variant {imported_variant_id} not found"

    variant = imported_variant.variant
    imported_product = imported_variant.imported_product
    shop = imported_product.shop
    user = shop.owner if shop else imported_product.user
    branding_type = variant.product.branding_type
    color = imported_product.background_color
    is_render_logo = branding_type == BrandType.BRAND_LOGO

    if variant.brand_settings is None:
        return f"Variant {variant.get_composed_title()} does not have branding settings"

    if not user:
        return f"User not found for imported product {imported_product.id}"

    image = generate_branded_image(user, variant.image, variant.brand_settings, color, is_render_logo=is_render_logo, scale_factor=2)
    thumbnail = generate_branded_image(user, variant.image, variant.brand_settings, None, is_render_logo=is_render_logo, scale_factor=1, is_transparent=True)

    imported_variant.image = image
    imported_variant.thumbnail = thumbnail
    imported_variant.save()

    # Refresh the imported product to push the changes to Shopify
    imported_product = ImportedProduct.objects.get(id=imported_product.id)

    if imported_product.shopify_product_id and not skip_shopify_update and shop and shop.is_active:
        try:
            sync_product_assets_in_shopify.delay(shop.id, imported_product.product_id)
        except ShopifyProductNotFound:
            return f"Shopify product not found for imported product {imported_product.id}"

    return f"Branded image for variant {variant.get_composed_title()} generated for user {user.id}"

@shared_task
def update_bulk_imported_products(user_id, products):
    user = CustomUser.objects.get(id=user_id)
    event_data = {"type": "UPDATE_IMPORTED_PRODUCTS"}
    channel_layer = get_channel_layer()
    response = None

    try:
        response = ImportedProductService.update_imported_products(user, products)
        event_data["success"] = True
    except Exception as e:
        response = str(e)
        event_data["success"] = False
        event_data["error"] = str(e)

    async_to_sync(channel_layer.group_send)(f"dropshipping_{user_id}", {'type': 'send_event', 'data': event_data})
    return response


@shared_task
def delete_bulk_imported_products(user_id, product_ids):
    user = CustomUser.objects.get(id=user_id)
    event_data = {"type": "DELETE_IMPORTED_PRODUCTS"}
    channel_layer = get_channel_layer()
    response = None

    try:
        response = ImportedProductService.delete_imported_products(user, product_ids)
        event_data["success"] = True
    except Exception as e:
        response = str(e)
        event_data["success"] = False
        event_data["error"] = str(e)

    async_to_sync(channel_layer.group_send)(f"dropshipping_{user_id}", {'type': 'send_event', 'data': event_data})
    return response


@shared_task
def sync_product_variants(user_id, product_id, variants):
    user = CustomUser.objects.get(id=user_id)
    event_data = {"type": "SYNC_PRODUCT_VARIANTS"}
    channel_layer = get_channel_layer()
    response = None

    try:
        response = ImportedProductService.sync_product_variants(user, product_id, variants)
        event_data["success"] = True
    except Exception as e:
        response = str(e)
        event_data["success"] = False
        event_data["error"] = str(e)

    async_to_sync(channel_layer.group_send)(f"dropshipping_{user_id}", {'type': 'send_event', 'data': event_data})
    return response


@shared_task
def deactivate_inactive_products():
    is_inactive = Q(imported_product__product__is_active=False) | Q(
        variant__is_active=False) | Q(imported_product__product__supplier__is_active=False)
    has_shop_or_user = Q(imported_product__shop__isnull=False) | Q(imported_product__user__isnull=False)

    inactive_imported_variants = ImportedVariant.objects.prefetch_related(
        "variant",
        "variant__product",
        "imported_product",
        "imported_product__shop",
        "imported_product__user",
        "imported_product__product__supplier"
    ).filter(
        is_inactive,
        has_shop_or_user,
        imported_product__is_live=True,
        shopify_variant_id__isnull=False,
        imported_product__shop__isnull=False,
        shopify_inventory_item_id__isnull=False
    ).order_by("imported_product__shop")

    for inactive_imported_variant in inactive_imported_variants:
        if inactive_imported_variant.imported_product.shop is not None:
            continue

        shop = Shop.objects.get_by_user(inactive_imported_variant.imported_product.user)
        inactive_imported_variant.imported_product.shop = shop

    variants_by_shop = groupby(inactive_imported_variants, lambda x: x.imported_product.shop)

    deactivated_titles_by_shop = {}
    for shop, imported_variants in variants_by_shop:
        deactivated_variants = _deactivate_inactive_products_for_shop(
            shop, imported_variants)

        if not deactivated_variants:
            continue

        deactivated_titles = [f"{imported_variant.variant.title} variant from {imported_variant.variant.product.title}" for imported_variant in deactivated_variants]

        deactivated_titles_by_shop[shop] = deactivated_titles

    send_mass_deactivated_product_email(deactivated_titles_by_shop)


def _deactivate_inactive_products_for_shop(shop, imported_variants):
    MAX_INVENTORY_ITEMS_PER_CALL = 50
    MAX_ARRAY_LEN = 250

    variants = {variant.shopify_inventory_item_id.split("/")[-1]: variant
                for variant in imported_variants}

    inventory_item_ids = variants.keys()

    inventory_items_batches = batched(
        inventory_item_ids, MAX_INVENTORY_ITEMS_PER_CALL)

    all_inventory_levels = []
    with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        for inventory_items_batch in inventory_items_batches:
            try:
                inventory_levels = shopify.InventoryLevel.find(
                    inventory_item_ids=",".join(inventory_items_batch),
                    limit=MAX_ARRAY_LEN
                )

                all_inventory_levels.extend(inventory_levels.copy())

                # Shopify API rate limit. We can't use GraphQL because it doesn't have this specific query
                sleep(1)

                while inventory_levels.has_next_page():
                    # Shopify API rate limit. We can't use GraphQL because it doesn't have this specific query
                    sleep(1)
                    inventory_levels = inventory_levels.next_page()
                    all_inventory_levels.extend(inventory_levels.copy())

            except pyactiveresource.connection.ClientError as e:
                if e.response.code in [401, 402, 403, 404]:
                    # Shops we don't have API access to
                    break

                logger.error(e)
                break

            except Exception as e:
                logger.error(e)
                continue

    if len(all_inventory_levels) == 0:
        return []

    adjusted_inventories = []
    inventory_pages = batched(all_inventory_levels, MAX_ARRAY_LEN)
    for inventory_page in inventory_pages:
        inventories = [
            {"inventoryItemId": f"gid://shopify/InventoryItem/{inventory_level.inventory_item_id}",
             "availableDelta": -inventory_level.available,
             "locationId": f"gid://shopify/Location/{inventory_level.location_id}"
             }
            for inventory_level in inventory_page
            if inventory_level.available is not None and inventory_level.available > 0
        ]

        if len(inventories) == 0:
            continue

        try:
            inventory_bulk_adjust_quantity(shop, inventories)
            adjusted_inventories.extend(inventories)
        except Exception as e:
            logger.error(e)
            continue

    adjusted_variants = sorted([variants[inventory["inventoryItemId"].split("/")[-1]]
                                for inventory in adjusted_inventories],
                               key=lambda x: x.variant.product.title)

    ImportedVariant.objects.filter(id__in=[variant.id for variant in adjusted_variants]
                                   ).update(shopify_available_quantity=0)

    return adjusted_variants

@shared_task
def async_create_order(shop_url, data):
    """
    This method will handle the order creation webhook from Shopify,
    creating the order in the database, and identifying our selling
    products for correct charging.
    """
    try:
        shop = Shop.objects.get(url=shop_url)
    except Shop.DoesNotExist:
        return False

    customer = None
    shipping_address = None
    shipping_country = None

    shopify_shipping_address = data.get("shipping_address")

    if shopify_shipping_address and isinstance(shopify_shipping_address, dict):
        shipping_country = shopify_shipping_address.get("country")

    # Identify if the lineitems are ours
    line_items_groups = {}
    suppliers = {}
    suppliers_to_skip = []

    for line_item in data["line_items"]:
        shopify_variant_id = f"gid://shopify/ProductVariant/{line_item['variant_id']}"
        imported_variant = ImportedVariant.objects.filter(
            shopify_variant_id=shopify_variant_id
        ).first()

        # If the imported variant does not exist, the product is not handled by us.
        if imported_variant is None:
            product_name = line_item.get("title", "")
            imported_product = ImportedProduct.objects.filter(product__title=product_name, shop=shop).first()
            if imported_product is None:
                continue

            imported_variant = ImportedVariant.objects.filter(imported_product=imported_product).first()
            if imported_variant is None:
                continue

        product = imported_variant.variant.product

        # If the product it is inactive, the product is not handled by us.
        if product.is_active is False:
            continue

        if product.accept_worldwide_shipping is False:
            if not shipping_country:
                send_line_item_country_not_supported_notification(
                    shop.owner, data["name"], product.title
                )
                continue

            accepts_country = ProductShipping.objects.filter(
                product=product,
                country__iexact=shipping_country).exists()
            supplier_accepts_country = product.supplier.address and product.supplier.address.country == shipping_country

            if not accepts_country and not supplier_accepts_country:
                send_line_item_country_not_supported_notification(
                    shop.owner, data["name"], product.title
                )
                continue

        supplier = product.supplier

        # If the quantity is less than the MOQ we don't accept the line item
        if int(line_item.get("quantity", 0)) < supplier.shopify_moq:
            suppliers_to_skip.append(supplier.id)
            continue

        line_item["product"] = product
        line_item["variant"] = imported_variant.variant
        line_item["imported_variant"] = imported_variant
        line_item["imported_product"] = imported_variant.imported_product
        line_item["supplier"] = supplier
        suppliers[supplier.id] = supplier

        line_items_groups[supplier.id] = line_items_groups.get(supplier.id, [])
        line_items_groups[supplier.id].append(line_item)

    # If there are no line items, return
    if len(line_items_groups) == 0:
        return

    if Order.objects.filter(shopify_order_id=data["admin_graphql_api_id"]).exists():
        return

    # Create the shipping address and customer
    if data.get("shipping_address") is not None:
        if data["shipping_address"].get("first_name") is not None:
            customer = Customer.objects.create(
                first_name=data["shipping_address"]["first_name"],
                last_name=data["shipping_address"]["last_name"],
            )

        shipping_address = Address.objects.create(
            line_1=data["shipping_address"].get("address1", ""),
            line_2=data["shipping_address"].get("address2", ""),
            city=data["shipping_address"].get("city", ""),
            state=data["shipping_address"].get("province", ""),
            country=data["shipping_address"].get("country", ""),
            zip=data["shipping_address"].get("zip", ""),
            phone=data["shipping_address"].get("phone", ""),
        )

    # Create the order
    order = Order.objects.create(
        shop=shop,
        order_type=OrderType.SHOPIFY,
        shopify_order_id=data["admin_graphql_api_id"],
        shopify_order_name=data["name"],
        customer=customer,
        shipping_address=shipping_address,
    )

    # Create the sub orders
    for supplier_id, line_items in line_items_groups.items():
        supplier = suppliers[supplier_id]
        is_international = False

        if supplier.id in suppliers_to_skip:
            send_suborder_not_accepted_notification(shop.owner, order.shopify_order_name, supplier.name)
            continue

        if supplier.address is not None and shipping_address is not None:
            is_international = supplier.address.country != shipping_address.country

        sub_order = SubOrder.objects.create(
            shop=shop,
            order=order,
            supplier=supplier,
            total_cost_cents=0,
            shipping_cost_cents=0,
            status=SubOrderStatus.UNPAID,
        )

        for line_item in line_items:
            variant = line_item["variant"]
            product = line_item["product"]
            imported_variant = line_item["imported_variant"]
            imported_product = line_item["imported_product"]

            line_item = LineItem.objects.create(
                sub_order=sub_order,
                product=product,
                variant=variant,
                title=variant.get_composed_title(),
                quantity=line_item["quantity"],
                shopify_price_cents=float(line_item["price"]) * 100,
                sku=variant.sku,
                shopify_product_id=imported_product.shopify_product_id,
                shopify_variant_id=imported_variant.shopify_variant_id,
            )
            # Update the variant inventory
            variant.update_inventory(line_item.quantity)
        # Update the sub order costs
        sub_order.update_costs()

        # If the total order cost is less than the MOQ cost from the supplier we don't accept the sub order
        if (sub_order.total_cost_cents + sub_order.shipping_cost_cents) < supplier.shopify_moq_price_cents:
            send_suborder_not_accepted_notification(shop.owner, order.shopify_order_name, supplier.name)
            sub_order.delete()

    # Delete the order if there are no sub orders
    if order.sub_orders.count() == 0:
        order.delete()
