from authentication.models import Shop
from .serializers import ShopifyProductSerializer
from django.conf import settings
import json
from shopify import Session, Product, GraphQL
from webhooks.subscription import create_shopify_webhooks

def get_product_list_for_shop(shop):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        products = Product.find()
        serializer = ShopifyProductSerializer(products, many=True)
        return serializer
    

def get_product_detail_from_id(shop, product_id):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        product = Product.find(product_id)
        serializer = ShopifyProductSerializer(product)
        return serializer
    
def get_shopify_webhooks(shop):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            {
                webhookSubscriptions (first: 100) {
                    edges {
                        node {
                            id
                            topic
                            endpoint {
                                __typename
                                ... on WebhookHttpEndpoint {
                                    callbackUrl
                                }
                            }
                        }
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query))
        subscriptions = []
        edges = return_response["data"]["webhookSubscriptions"]["edges"]
        for edge in edges:
            subscriptions.append(edge["node"])
        return subscriptions


def delete_shopify_webhook(shop, subscription_id):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = { "id": subscription_id }

        query = """
            mutation webhookSubscriptionDelete($id: ID!) {
                webhookSubscriptionDelete(id: $id) {
                    userErrors { field message }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        return return_response
    
def create_webhooks(shop):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        create_shopify_webhooks()

def get_app_subscription(shop, subscription_id):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
        query {
            node(id: "%s") {
                ...on AppSubscription {
                    createdAt
                    currentPeriodEnd
                    status
                }
            }
        }
        """ % subscription_id

        return_response = json.loads(GraphQL().execute(query))
        return return_response


def get_shopify_collections(shop):
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            {
                collections(first: 20) {
                    edges {
                        node {
                            id
                            title
                        }
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query))
        collections = []
        edges = return_response["data"]["collections"]["edges"]
        for edge in edges:
            collections.append({"label": edge["node"]["title"], "value": edge["node"]["id"]})
        return collections
