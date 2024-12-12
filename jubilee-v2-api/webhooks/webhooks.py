from billing.stripe import stripe_cancel_subscription
from dropshipping.models import DropshipSettings, ImportedProduct, Order, SubOrder
from rest_framework.response import Response
from .decorators import webhook
from authentication.models import PaymentProvider, Shop
from billing.models import Subscription, ActiveStatus, AppSetting
from dropshipping.webhooks import handle_create_order
from django.db.models import Q
from shopify_integration.management.commands.reset_webhooks import Command
import time
import logging
from django.conf import settings
from dropshipping.models import ImportedVariant

logger = logging.getLogger(__name__)

def retry_stripe_cancel_subscription(subscription, tries=0):
    try:
        stripe_cancel_subscription(subscription)
    except Exception as e:
        if tries >= 3:
            logger.error(e)
            return
        time.sleep(1)
        retry_stripe_cancel_subscription(subscription, tries + 1)


def auto_reset_webhooks_if_needed(shop_url):
    """
    Automatically reset webhooks for a shop if needed.
    Uses the existing process_shop function for proper webhook management.
    """
    try:
        shop = Shop.objects.get(url=shop_url, is_active=True)
        print(f"Auto-resetting webhooks for {shop_url}")
        
        # Use the existing process_shop function to reset webhooks
        command = Command()
        command.process_shop(shop, skip_delete=False, skip_create=False)
        
        return True
    except Shop.DoesNotExist:
        print(f"Shop {shop_url} not found or inactive")
        return False
    except Exception as e:
        logger.error(f"Error resetting webhooks for {shop_url}: {e}")
        return False


def delete_shop(shop_url):
    try:
        shop = Shop.objects.get(url=shop_url)
    except Shop.DoesNotExist:
        return False

    app_settings = AppSetting.objects.last()
    if app_settings.stripe_cancel_on_uninstall:
        try:
            subscriptions = Subscription.objects.filter(
                payment_provider=PaymentProvider.STRIPE,
                status=ActiveStatus.ACTIVE,
                user=shop.owner,
            )
            for subscription in subscriptions:
                retry_stripe_cancel_subscription(subscription)
        except Exception as e:
            logger.error(e)

    shopify_subscriptions = Subscription.objects.filter(
        payment_provider=PaymentProvider.SHOPIFY,
        status=ActiveStatus.ACTIVE,
        user=shop.owner,
    )

    for subscription in shopify_subscriptions:
        subscription.user = None
        subscription.shop = None
        subscription.status = ActiveStatus.INACTIVE
        subscription.save()

    imported_products = ImportedProduct.objects.filter(Q(shop=shop) | Q(user=shop.owner))
    for product in imported_products:
        product.delete()

    sub_orders = SubOrder.objects.filter(shop=shop)
    for order in sub_orders:
        order.user = shop.owner
        order.shop = None
        order.save()
    
    orders = Order.objects.filter(shop=shop)
    for order in orders:
        order.user = shop.owner
        order.shop = None
        order.save()

    dropshipping_settings = DropshipSettings.objects.filter(Q(shop=shop) | Q(user=shop.owner))
    for dropshipping_setting in dropshipping_settings:
        if dropshipping_setting.user is None:
            dropshipping_setting.delete()
        else:
            dropshipping_setting.shopify_location_id = None
            dropshipping_setting.shop = None
            dropshipping_setting.save()

    shop.delete()
    return True


@webhook
def get_customer_data(request):
    customer_email = request.webhook_data["customer"]["email"]
    return Response({customer_email}, status=200)


@webhook
def redact_customer_data(request):
    # For now, only customer email is stored in the database
    customer_email = request.webhook_data["customer"]["email"]
    # remove customer data here
    return Response(status=200)


@webhook
def redact_shop_data(request):
    shop_url = request.webhook_domain
    delete_shop(shop_url)
    return Response(status=200)


@webhook
def app_uninstalled(request):
    shop_url = request.webhook_domain
    delete_shop(shop_url)
    return Response(status=200)


@webhook
def create_order(request):
    print(request.webhook_data)
    try:
        handle_create_order(request)
    except Exception as e:
        logger.error(e)
        
        # Auto-reset webhooks if there's an error
        shop_url = getattr(request, 'webhook_domain', None)
        if shop_url:
            auto_reset_webhooks_if_needed(shop_url)
    
    return Response(status=200)


@webhook
def inventory_levels_update(request):
    """
    Handle Shopify inventory level updates.
    Updates the shopify_available_quantity for corresponding ImportedVariant.
    
    Shopify sends inventory level updates when:
    - Product quantities change
    - Inventory adjustments are made
    - Orders are fulfilled/cancelled
    """
    try:
        print('---------------- inventory_levels_update -------------------')
        print(request)
        webhook_data = request.webhook_data
        shop_url = request.webhook_domain
        
        # Extract inventory level data from webhook
        inventory_item_id = webhook_data.get('inventory_item_id')
        location_id = webhook_data.get('location_id')
        available_quantity = webhook_data.get('available')
        
        print(f"Inventory update webhook received for shop: {shop_url}, "
                   f"inventory_item_id: {inventory_item_id}, "
                   f"location_id: {location_id}, "
                   f"available_quantity: {available_quantity}")
        
        if not inventory_item_id:
            print("No inventory_item_id found in webhook data")
            return Response({"error": "inventory_item_id required"}, status=400)
        
        # Find the ImportedVariant with matching shopify_inventory_item_id
        # Filter by shop to ensure we're updating the right variant
        shop = Shop.objects.filter(url=shop_url, is_active=True).first()
        if not shop:
            print(f"Shop {shop_url} not found or inactive")
            return Response({"error": "Shop not found"}, status=404)
        
        imported_variants = ImportedVariant.objects.filter(
            Q(imported_product__shop=shop) | Q(imported_product__user=shop.owner),
            shopify_inventory_item_id=str(inventory_item_id)
        )
        
        if not imported_variants.exists():
            print(f"No ImportedVariant found with inventory_item_id: {inventory_item_id}")
            return Response({"message": "Variant not found, possibly not imported"}, status=200)
        
        # Update the shopify_available_quantity for all matching variants
        updated_count = 0
        for imported_variant in imported_variants:
            old_quantity = imported_variant.shopify_available_quantity
            imported_variant.shopify_available_quantity = available_quantity
            imported_variant.save()
            
            print(f"Updated ImportedVariant {imported_variant.id}: "
                       f"quantity changed from {old_quantity} to {available_quantity}")
            updated_count += 1
        
        return Response({
            "message": f"Successfully updated {updated_count} variants",
            "inventory_item_id": inventory_item_id,
            "new_quantity": available_quantity
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error processing inventory levels update: {e}")
        
        # Auto-reset webhooks if there's an error
        shop_url = getattr(request, 'webhook_domain', None)
        if shop_url:
            auto_reset_webhooks_if_needed(shop_url)
        
        return Response({"error": "Internal server error"}, status=500)


@webhook
def inventory_items_update(request):
    """
    Handle Shopify inventory item updates.
    This webhook is triggered when inventory item properties change,
    not just quantity changes.
    """
    try:
        print('---------------- inventory_items_update -------------------')
        print(request)
        webhook_data = request.webhook_data
        shop_url = request.webhook_domain
        
        # Extract inventory item data
        inventory_item_id = webhook_data.get('id')
        sku = webhook_data.get('sku')
        tracked = webhook_data.get('tracked')
        
        print(f"Inventory item update webhook received for shop: {shop_url}, "
                   f"inventory_item_id: {inventory_item_id}, "
                   f"sku: {sku}, tracked: {tracked}")
        
        if not inventory_item_id:
            logger.warning("No inventory_item_id found in webhook data")
            return Response({"error": "inventory_item_id required"}, status=400)
        
        # Find the shop
        shop = Shop.objects.filter(url=shop_url, is_active=True).first()
        if not shop:
            logger.warning(f"Shop {shop_url} not found or inactive")
            return Response({"error": "Shop not found"}, status=404)
        
        # Find and update ImportedVariants
        imported_variants = ImportedVariant.objects.filter(
            Q(imported_product__shop=shop) | Q(imported_product__user=shop.owner),
            shopify_inventory_item_id=str(inventory_item_id)
        )
        
        updated_count = 0
        for imported_variant in imported_variants:
            # You can add logic here to update other fields if needed
            # For now, we'll just log that we received the update
            print(f"Inventory item update received for ImportedVariant {imported_variant.id}")
            updated_count += 1
        
        return Response({
            "message": f"Processed inventory item update for {updated_count} variants",
            "inventory_item_id": inventory_item_id
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error processing inventory items update: {e}")
        
        # Auto-reset webhooks if there's an error
        shop_url = getattr(request, 'webhook_domain', None)
        if shop_url:
            auto_reset_webhooks_if_needed(shop_url)
        
        return Response({"error": "Internal server error"}, status=500)