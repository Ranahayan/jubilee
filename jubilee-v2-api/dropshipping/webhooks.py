from .models import (
    SubOrder,
    SubOrderStatus,
)
from .notifications import (
    notify_suborder_refunded,
    notify_suborder_paid,
    notify_suborder_cancelled,
    notify_suborder_require_action,
)
from django.utils import timezone
from dropshipping.tasks import async_create_order, create_fulfillment_for_subOrder, accept_fulfillment_request_for_sub_order
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from authentication.models import Shop
from dropshipping.services import (
  accept_fulfillment_request,
  assigned_fulfillment_orders,
  get_shopify_order_by_fulfillment_order_id,
  create_fulfillment_without_suborder,
)
from webhooks.decorators import webhook
import logging
logger = logging.getLogger(__name__)

def handle_create_order(request):
    """Handle the create order webhook."""
    try:
        webhook_data = request.webhook_data
        data = {
            'shipping_address': webhook_data.get("shipping_address"),
            'line_items': webhook_data["line_items"],
            'name': webhook_data["name"],
            'admin_graphql_api_id': webhook_data["admin_graphql_api_id"]
        }
        async_create_order.delay(request.webhook_domain, data)
    except Exception as e:
        logger.error(e)

def change_dropshipping_suborder_status(payment_intent, is_refund=False):
    """
    This method will change the status of a suborder based on the payment intent status.
    """
    sub_order = SubOrder.objects.filter(
        stripe_payment_intent_id=payment_intent["id"]
    ).first()
    if sub_order is None:
        return

    if sub_order.shop:
        user = sub_order.shop.owner
    else:
        user = sub_order.user

    if is_refund:
        sub_order.status = SubOrderStatus.REFUNDED
        sub_order.save()
        notify_suborder_refunded(user, sub_order)
        return

    if payment_intent["status"] == "succeeded":
        sub_order.status = SubOrderStatus.PAID
        sub_order.checkout_at = timezone.now()
        sub_order.save()
        notify_suborder_paid(user, sub_order)
        return

    if payment_intent["status"] == "canceled" or (
        payment_intent["status"] == "requires_payment_method"
        and payment_intent["last_payment_error"]
    ):
        sub_order.status = SubOrderStatus.UNPAID
        sub_order.save()
        notify_suborder_cancelled(user, sub_order)
        return

    if (
        payment_intent["next_action"]
        and payment_intent["next_action"]["type"] == "redirect_to_url"
    ):
        url = payment_intent["next_action"]["redirect_to_url"]["url"]
        notify_suborder_require_action(user, sub_order, url)


@csrf_exempt
@api_view(('POST',))
def fulfillment_order_notification(request):
    
    try:
        shop_domain = request.META.get('HTTP_X_SHOPIFY_SHOP_DOMAIN')
        shop = Shop.objects.get(url=shop_domain)
        data = assigned_fulfillment_orders(shop)
        fullfillments = data["shop"]["assignedFulfillmentOrders"]["edges"]

        for fullfillment in fullfillments:
            try:
                fullfillment_order_id = fullfillment["node"]["id"]
                
                order_data = get_shopify_order_by_fulfillment_order_id(shop, fullfillment_order_id)
                shopify_order_id = order_data["fulfillmentOrder"]["order"]["id"]
                
                suborder = SubOrder.objects.filter(order__shopify_order_id=shopify_order_id).first()

                if suborder is None:
                    try:
                        accept_fulfillment_request(shop, fullfillment_order_id)
                    except Exception as e:
                        logger.warning(f"[FULFILLMENT_WEBHOOK] Could not accept fulfillment, continuing to create fulfillment: {str(e)}")
                        # Don't capture this exception as it might be normal behavior if already accepted
                    try:
                        create_fulfillment_without_suborder(shop, fullfillment_order_id)
                    except Exception as e:
                        error_msg = str(e)
                        if "api_client does not have access" in error_msg:
                            logger.warning(f"[FULFILLMENT_WEBHOOK] Cannot fulfill order - not assigned to our fulfillment service")
                        else:
                            logger.exception(f"[FULFILLMENT_WEBHOOK] Error creating fulfillment without suborder: {e}")
                    continue

                accept_fulfillment_request(shop, fullfillment_order_id)

                # Mirror working flow: accept then queue a task to set tracking placeholders and fulfill
                accept_fulfillment_request_for_sub_order.apply_async(args=(suborder.id,), countdown=5)

            except Exception as e:
                logger.exception(f"[FULFILLMENT_WEBHOOK] Error processing fulfillment edge: {e}")

    except Exception as e:
        logger.exception(f"[FULFILLMENT_WEBHOOK] Error handling webhook: {e}")

    return Response(status=200)
