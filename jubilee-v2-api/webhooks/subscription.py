import shopify
import json
from django.conf import settings
# If you want to test with NGrok replace the following url with the ngrok url.
CALLBACK_BASE_URL = settings.API_URL


def create_shopify_webhook_rest(endpoint, topic):
    address = CALLBACK_BASE_URL + "/webhooks/shopify/" + endpoint + "/"
    webhook = shopify.Webhook()
    webhook.topic = topic
    webhook.address = address
    webhook.format = "json"
    webhook.save()
    return webhook


def create_shopify_webhook_graphql(endpoint, topic):
    address = CALLBACK_BASE_URL + "/webhooks/shopify/" + endpoint + "/"
    query = """
        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            userErrors {
              field
              message
            }
            webhookSubscription {
                callbackUrl
                format
            }
          }
        }
    """
    variables = {
        "topic": topic,
        "webhookSubscription": {
            "callbackUrl": address,
            "format": "JSON"
        }
    }
    response = shopify.GraphQL().execute(query, variables)
    return json.loads(response)


def create_shopify_webhooks():  # REQUIRES OPEN SHOPIFY SESSION
    create_shopify_webhook_rest("create_order", "orders/create")
    create_shopify_webhook_graphql("one_time_payment_update", "APP_PURCHASES_ONE_TIME_UPDATE")
    create_shopify_webhook_graphql("subscription_update", "APP_SUBSCRIPTIONS_UPDATE")
    create_shopify_webhook_rest("app_uninstalled", "app/uninstalled")
