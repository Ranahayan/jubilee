import json
from functools import wraps
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseBadRequest, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status

from .helpers import domain_is_valid, hmac_is_valid
from authentication.models import Shop
from shopify_integration.management.commands.reset_webhooks import Command
import logging

logger = logging.getLogger(__name__)


class HttpResponseMethodNotAllowed(HttpResponse):
    status_code = 405


class HttpResponseUnauthorized(HttpResponse):
    status_code = 401


def auto_reset_webhooks_on_error(f):
    """
    Decorator that automatically resets webhooks when 401/403 errors occur, either by exception or by response status code.
    """
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        response = None
        try:
            response = f(request, *args, **kwargs)
        except Exception as e:
            # Existing logic for exceptions
            if hasattr(request, 'webhook_domain'):
                shop_url = request.webhook_domain
                try:
                    shop = Shop.objects.get(url=shop_url, is_active=True)
                    command = Command()
                    print(f"Auto-resetting webhooks for {shop_url} due to exception: {e}")
                    command.process_shop(shop, skip_delete=False, skip_create=False)
                    # Try the request again
                    return f(request, *args, **kwargs)
                except Exception as reset_error:
                    logger.error(reset_error)
            raise e

        # --- NEW LOGIC: Check for 401/403 responses ---
        if hasattr(request, 'webhook_domain') and hasattr(response, 'status_code'):
            if response.status_code in (401, 403):
                shop_url = request.webhook_domain
                try:
                    shop = Shop.objects.get(url=shop_url, is_active=True)
                    command = Command()
                    print(f"Auto-resetting webhooks for {shop_url} due to response status {response.status_code}")
                    command.process_shop(shop, skip_delete=False, skip_create=False)
                    # Try the request again
                    return f(request, *args, **kwargs)
                except Exception as reset_error:
                    logger.error(reset_error)
        return response
    return wrapper


def webhook(f):
    """
    A view decorator that checks and validates a Shopify Webhook request.
    """

    @csrf_exempt
    @api_view(('POST',))
    @renderer_classes((JSONRenderer,))
    @auto_reset_webhooks_on_error
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        # Ensure the request is a POST request.
        if request.method != 'POST':
            return HttpResponseMethodNotAllowed()

        # Try to get required headers and decode the body of the request.
        try:
            topic = request.META['HTTP_X_SHOPIFY_TOPIC']
            domain = request.META['HTTP_X_SHOPIFY_SHOP_DOMAIN']
            hmac = request.META['HTTP_X_SHOPIFY_HMAC_SHA256'] if 'HTTP_X_SHOPIFY_HMAC_SHA256' in request.META else None
            data = json.loads(request.body.decode('utf-8'))
        except (KeyError, ValueError) as e:
            return HttpResponseBadRequest()

        # Verify the domain.
        if not domain_is_valid(domain):
            return HttpResponseBadRequest()

        # Verify the HMAC.
        if not hmac_is_valid(request.body, settings.SHOPIFY_CLIENT_SECRET, hmac):
            return HttpResponseUnauthorized()

        # Otherwise, set properties on the request object and return.
        request.webhook_topic = topic
        request.webhook_data = data
        request.webhook_domain = domain
        return f(request, *args, **kwargs)

    return wrapper
