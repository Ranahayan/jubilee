import base64
from datetime import datetime
import io
import math
from django.conf import settings
import json
import requests
from ai.providers.openai import OpenAIProvider
from ai.services.ai_manager import AIManager
from authentication.models import Shop
from billing.models import ActiveStatus, Subscription
from dropshipping.prompts import IMAGE_SEARCH_PROMPT
from dropshipping.serializers import ImportedProductSerializer, ImportedProductUpdateSerializer, VariantSerializer
from dropshipping.errors import ShopifyLocationIdNotFound, ShopifyProductNotFoundError, ShopifyTrialAccountError, ResponseError
from shopify import Session, GraphQL
import random
import string
from file.models import File
from .helpers import sanitize_sku
from .models import DropshipSettings, ImageDescription, ImportedVariant, ImportedProduct, ProductVariant, SubOrder, ProductAsset
from dropshipping.errors import ShopifyProductNotFound
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from PIL import Image
from langchain_core.messages import HumanMessage
import logging

logger = logging.getLogger(__name__)
from .constants import (
    DEFAULT_LOCATION_NAME,
    DEFAULT_LOCATION_CITY,
    DEFAULT_LOCATION_ZIP,
    DEFAULT_LOCATION_ADDRESS,
    DEFAULT_LOCATION_ADDRESS2,
    DEFAULT_PROVINCE_CODE,
    DEFAULT_COUNTRY_CODE
)

def check_for_errors(data, msg):
    if len(data.get("userErrors", [])):
        message = data["userErrors"][0]["message"]
        
        if "couldn't be set because the location was deleted" in message:
            raise ShopifyLocationIdNotFound()
        
        if "trial accounts" in message:
            raise ShopifyTrialAccountError()
        
        if "Product does not exist" in message:
            raise ShopifyProductNotFoundError()

        error = Exception(f"{msg} - {message}")
        logger.error(error, extra={"userErrors": data["userErrors"]})
        raise error
    
def random_code(length=5):
    characters = string.ascii_letters + string.digits  # includes uppercase letters, lowercase letters, and digits
    random_string = ''.join(random.choice(characters) for _ in range(length))
    return random_string

def create_fulfillment_service(shop):
    """
        Creates a fulfillment service in the Shopify store. 
        This is used to generate fulfillment orders. Additionally, 
        the location is employed to manage inventory.
    """
    
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = {
            "callbackUrl": f"{settings.API_URL}/dropshipping",
            "name": f"{settings.FULFILLMENT_SERVICE_NAME} ({random_code()})",
            "inventoryManagement": settings.INVENTORY_MANAGEMENT,
            "trackingSupport": True,
        }

        
        query = """
            mutation fulfillmentServiceCreate($callbackUrl: URL!, $name: String!, $inventoryManagement: Boolean, $trackingSupport: Boolean) {
                fulfillmentServiceCreate(
                    callbackUrl: $callbackUrl,
                    name: $name,
                    inventoryManagement: $inventoryManagement,
                    trackingSupport: $trackingSupport
                ) {
                    fulfillmentService {
                        id
                        serviceName
                        callbackUrl
                        location { id }
                    }
                    userErrors { field message }
                }
            }
        """

        raw = GraphQL().execute(query, mutation_variables)
        resp = json.loads(raw)

        # Top-level errors (no data)
        if resp.get("errors") and not resp.get("data"):
            raise Exception(f"Shopify GraphQL error: {resp['errors']}")

        fs_create = (resp.get("data") or {}).get("fulfillmentServiceCreate") or {}
        check_for_errors(fs_create, "Error creating fulfillment service.")

        svc = fs_create.get("fulfillmentService") or {}
        loc = (svc.get("location") or {}).get("id")
        if not svc.get("id") or not loc:
            raise Exception("Shopify did not return fulfillment service/location IDs.")

        return { "id": svc["id"], "location_id": loc }

def get_media_data(asset):
    """
        Prepare the data from the Asset serializer for creating a media in Shopify.
    """
    return {
        "originalSource": asset,
        "mediaContentType": "IMAGE"
    }

def get_variant_data(variant, location_id=None):
    """
        Prepare the data from the Product Variant serializer for creating a variant in Shopify.
    """
    data = {
        "price": variant["retail_price_cents"] / 100,
        "inventoryPolicy": "DENY",
        "inventoryItem": {
            "tracked": True,
            "requiresShipping": True,
            "cost": variant["price_cents"] / 100,
            "sku": variant["sku"] or variant.get("aliexpress_variant_id"),
            "measurement": {
                "weight": variant["weight"]
            }
        },
        "inventoryQuantities": [{
            "availableQuantity": variant["inventory_quantity"] or 0,
            "locationId": location_id
        }],
        "metafields": [{
            "key": "ref_variant_id",
            "value": str(variant["id"]),
            "namespace": "global",
            "type": "integer"
        }]
    }

    if variant.get("image") is not None:
        data["mediaSrc"] = [variant["image"]]

    options = []

    if variant.get("selected_options") is not None:
        sorted_options = sorted(variant["selected_options"], key=lambda x: x["name"])
        for option in sorted_options:
            options.append(
                {"name": option["value"], "optionName": option["name"]}
            )

    if len(options) > 0:
        data["optionValues"] = options
    else:
        data["optionValues"] = {"name": variant["title"], "optionName": "Title"}

    return data

def get_variant_id_from_metafields(metafields):
    """
        Retrieve the variant ID from the metafields.
    """
    for metafield in metafields:
        if metafield["node"]["key"] == "ref_variant_id":
            return int(metafield["node"]["value"])
    return None

def create_shopify_product(shop, product):
    """
        Function to create a product in the Shopify store.
        Expected params.

        Param product is the serilized data from dropshipping imported product model.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        location_id = get_location_id(shop)
        product_media = []

        # Format media assets for the product
        assets = ProductAsset.objects.filter(product_id=product["id"]).order_by("order")
        for asset in assets:
            product_media.append(get_media_data(asset.image.url))

        # Format product options
        options = []
        if product["options"] is not None:
            sorted_options = sorted(product["options"], key=lambda x: x["name"])
            for option in sorted_options:
                options.append(
                    {
                        "name": option["name"],
                        "values": [{"name": value} for value in option["values"]]
                    }
                )
        else:
            option_values = []
            for variant in product["variants"]:
                option_values.append(variant["title"])

            options.append(
                {
                    "name": "Title",
                    "values": option_values
                }
            )

        # Set up the product input for the mutation.
        product_creation_mutation_variables = {
            "product": {
                "title": product["title"],
                "descriptionHtml": product["description"],
                "productOptions": options,
                 "tags": product["tags"],
                "collectionsToJoin": product["collections"],
            },
            "media": product_media
        }

        product_creation_query = """
            mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
                productCreate(product: $product, media: $media) {
                    product {
                        id
                    }
                    userErrors { field message }
                }
            }
        """

        # Execute the product creation mutation
        try:
            return_response = json.loads(GraphQL().execute(product_creation_query, product_creation_mutation_variables))
            check_for_errors(return_response["data"]["productCreate"], "Error creating product.")
        except ShopifyLocationIdNotFound:
            location_id = get_location_id(shop, reset_location=True)
            return_response = json.loads(GraphQL().execute(product_creation_query, product_creation_mutation_variables))

        product_creation_data = return_response["data"]["productCreate"]["product"]

        # Get the imported variants for the product and shop
        imported_variants = ImportedVariant.objects.filter(
            imported_product__shop=shop,
            imported_product__product_id=product["id"]
        )

        imported_variants_dic = {i_variant.variant_id: i_variant for i_variant in imported_variants}

        variants = []
        variant_media = []

        # Format variants and their options.
        # Also add the variant image to the media list.
        for variant in product["variants"]:
            i_variant = imported_variants_dic.get(variant["id"])
            # Replace the variant image with the imported variant image.
            # This is necessary to associate the image with the variant in Shopify.
            if i_variant is not None:
                if i_variant.image is not None:
                    variant["image"] = i_variant.image.url
                    variant_media.append(get_media_data(i_variant.image.url))
                else:
                    # Add the default image to the media list.
                    if variant.get("image") is not None:
                        variant_media.append(get_media_data(variant["image"]))
            # Add the variant to the variants list.
            variants.append(get_variant_data(variant, location_id))

        # Setup the product variants bulk creation mutation.
        product_variants_bulk_creation_mutation_variables = {
            "productId": product_creation_data["id"],
            "variants": variants,
            "media": variant_media,
            "locationId": location_id
        }

        product_variants_bulk_creation_query = """
            mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $media: [CreateMediaInput!], $locationId: ID!) {
                productVariantsBulkCreate(productId: $productId, strategy: REMOVE_STANDALONE_VARIANT, variants: $variants, media: $media) {
                    product {
                        id
                    }
                    productVariants {
                        id
                        inventoryItem {
                            id
                            inventoryLevel (locationId: $locationId) {
                                id
                                quantities (names: ["available"]) {
                                    quantity
                                }
                            }
                        }

                        metafields (first: 1) {
                            edges {
                                node {
                                    key
                                    value
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        """

        # Execute the product variants bulk creation mutation
        try:
            return_response = json.loads(GraphQL().execute(product_variants_bulk_creation_query,
                                                           product_variants_bulk_creation_mutation_variables))
            check_for_errors(return_response["data"]["productVariantsBulkCreate"], "Error creating product variants.")
        except ShopifyLocationIdNotFound:
            location_id = get_location_id(shop, reset_location=True)
            return_response = json.loads(GraphQL().execute(product_variants_bulk_creation_query,
                                                           product_variants_bulk_creation_mutation_variables))
        except Exception as e:
            # Delete created product if Variants creation fails
            delete_shopify_product(shop, shopify_product_id=product_creation_data["id"])
            raise Exception(f"Error creating product variants. Product deleted. {str(e)}")

        product_bulk_variants_creation_response = return_response["data"]["productVariantsBulkCreate"]
        check_for_errors(product_bulk_variants_creation_response, "Error creating product variants.")

        # Save the Shopify product ID in the imported product instance.
        imported_product = ImportedProduct.objects.get(Q(shop=shop) | Q(user=shop.owner), product_id=product["id"])
        shopify_product_id = product_creation_data["id"]

        # Save the imported variant data
        for variant in product_bulk_variants_creation_response["productVariants"]:
            if variant["inventoryItem"] is not None:
                product_variant = ProductVariant.objects.get(
                    id=get_variant_id_from_metafields(variant["metafields"]["edges"]))

                variants = ImportedVariant.objects.filter(
                    imported_product=imported_product,
                    variant=product_variant
                ).order_by('-id')

                if variants.count() > 1:
                    latest_variant = variants.first()
                    variants.exclude(id=latest_variant.id).delete()

                ImportedVariant.objects.update_or_create(
                    imported_product=imported_product,
                    variant=product_variant,
                    defaults={
                        "shopify_variant_id": variant["id"],
                        "shopify_inventory_item_id": variant["inventoryItem"]["id"],
                        "shopify_inventory_level_id": variant["inventoryItem"]["inventoryLevel"]["id"],
                        "shopify_available_quantity": variant["inventoryItem"]["inventoryLevel"]["quantities"][0]['quantity'], 
                    }
                )

        return shopify_product_id

def update_shopify_product(shop, shopify_product_id, payload):
    """
        Function to update the product data in the Shopify store.
        Expected params.

        Param shopify_product_id is the Shopify product ID.
        Param payload is the product fields that will change.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = { "product": { "id": shopify_product_id } }
        mutation_variables["product"].update(payload)

        query = """
            mutation productUpdate($product: ProductUpdateInput!) {
                productUpdate(product: $product) {
                    product { id }
                    userErrors { field message }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(return_response["data"]["productUpdate"], "Error updating product.")
        return return_response["data"]

def delete_shopify_product(shop, shopify_product_id):
    """
        Function to delete the product data in the Shopify store.
        Expected params.

        Param shopify_product_id is the Shopify product ID.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = { "input": { "id": shopify_product_id } }

        query = """
            mutation productDelete($input: ProductDeleteInput!) {
                productDelete(input: $input) {
                    deletedProductId
                    userErrors { field message}
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(return_response["data"]["productDelete"], "Error deleting product.")
        return return_response["data"]

def update_shopify_variant(shop, product_id, shopify_variant_id, payload):
    """
    Updates a variant in the Shopify store using bulk mutation.

    Parameters:
    - shopify_variant_id (str): Shopify variant ID.
    - payload (dict): Fields to update in the variant.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = {
            "productId": product_id,
            "variants": [{
                "id": shopify_variant_id,
                **payload
            }]
        }

        query = """
            mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                    product { id }
                    productVariants {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        """

        response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(response["data"]["productVariantsBulkUpdate"], "Error updating variant.")
        variants = response["data"]["productVariantsBulkUpdate"].get("productVariants", [])
        if not variants:
            raise Exception("No variants were updated.")

        return variants[0]

def add_location(shop, name: str, address1: str, address2: str, city: str, country_code: str, zip= None, province_code = None):
    """
    Adds a new location to Shopify using the `locationAdd` mutation.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = {
            "input": {
                "name": name,
                "address": {
                    "address1": address1,
                    "address2": address2,
                    "city": city,
                    "zip": zip,
                    "provinceCode": province_code,
                    "countryCode": country_code,
                }
            }
        }
        query = """
        mutation AddLocation($input: LocationAddInput!) {
          locationAdd(input: $input) {
            location {
                id
                name
                address {
                    address1
                    provinceCode
                    countryCode
                    zip
                }
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        response = json.loads(GraphQL().execute(query, mutation_variables))

        if "errors" in response:
            raise Exception(f"Shopify API Error: {response['errors']}")

        location_data = response.get("data", {}).get("locationAdd", {})
        location = location_data.get("location")
        check_for_errors(location_data, "Failed to add location to Shopify.")

        if not location:
            raise Exception("Location was not created successfully.")

        return location["id"]

def find_location_by_name(shop):
    """
    Searches for a Shopify location by name.
    Returns the location ID if found, otherwise returns None.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
        query {
          locations(first: 100) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
        """
        response = json.loads(GraphQL().execute(query))
        locations = response.get("data", {}).get("locations", {}).get("edges", [])

        for loc in locations:
            if loc["node"]["name"].strip().lower() == DEFAULT_LOCATION_NAME.strip().lower():
                return loc["node"]["id"]

    return None

def get_location_id(shop, reset_location=False):
  """
    Retrieve the location ID; if it doesn't exist, create a 
    Fulfillment service and return the location ID. Additionally,
    update the location in the DropshipSettings model instance for the shop.
  """
  if shop is None:
    raise Exception("Shop does not exists.")

  dropship_settings = DropshipSettings.objects.filter(Q(shop=shop) | Q(user=shop.owner)).first()

  if dropship_settings is None:
    shop_data = get_shop_details(shop)
    dropship_settings = DropshipSettings.objects.create(
        shop=shop,
        invoice_store_name=shop_data["name"],
        invoice_contact_email=shop_data["contactEmail"],
        invoice_website=shop_data["primaryDomain"]["host"]
    )

  if dropship_settings.shopify_location_id and not reset_location:
    return dropship_settings.shopify_location_id
  
  fulfillment_service = create_fulfillment_service(shop)
  dropship_settings.shopify_location_id = fulfillment_service["location_id"]
  dropship_settings.save()
  return fulfillment_service["location_id"]

def inventory_bulk_adjust_quantity(shop, inventories):
    """
        Adjust the inventory quantity for all products in the provided location.

        inventoryItemAdjustments is a list of inventory adjustments. Each inventory adjustment is an 
        object with the following fields:

        - inventoryItemId: The ID of the inventory item to adjust.
        - availableDelta: The amount to adjust the available quantity by.
        - locationId: The ID of the location where the inventory adjustment is being made.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = {
            "input": {
                "reason": "other",
                "name": "available",
                "changes": [
                    {
                        "delta": inventory["availableDelta"],
                        "inventoryItemId": inventory["inventoryItemId"],
                        "locationId": inventory["locationId"]
                    }
                    for inventory in inventories
                ]
            },
        }

        query = """
            mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
                inventoryAdjustQuantities(input: $input) {
                    userErrors {
                        field
                        message
                    }
                    inventoryAdjustmentGroup {
                        createdAt
                        reason
                        referenceDocumentUri
                        changes {
                            name
                            delta
                        }
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(return_response["data"]["inventoryAdjustQuantities"], "Error adjusting inventory quantity.")
        return return_response["data"]["inventoryAdjustQuantities"]["inventoryAdjustmentGroup"]

def add_media_to_product(shop, product_id, medias):
    """
        Function to add media to a product in the Shopify store.
        medias is a list of images links.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        transformed_medias = []

        for media in medias:
            transformed_medias.append(get_media_data(media))

        mutation_variables = {
            "media": transformed_medias,
            "product": { "id": product_id },
        }

        query = """
            mutation UpdateProductWithNewMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
                productUpdate(product: $product, media: $media) {
                    product {
                        id
                      	media(first: 50) {
                            nodes { id }
                        }
                    }
                    userErrors { field message }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(return_response["data"]["productUpdate"], "Error adding media to product.")
        return return_response["data"]["productUpdate"]["product"]["media"]["nodes"]

def delete_all_medias_from_product(shop, product_id):
    """
        Function to delete all media from a product in the Shopify store.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):

        query_variables = { "id": product_id }

        query = """
            query($id: ID!) {
                product(id: $id) {
                    media (first: 100) {
                        edges { node { id } }
                    }
                }
            }
        """
        query_response = json.loads(GraphQL().execute(query, query_variables))
        product = query_response["data"]["product"]
        if product is None:
            raise ShopifyProductNotFound("Product not found.")
        medias = product["media"]["edges"]

        media_ids = []
        for media in medias:
            media_ids.append(media["node"]["id"])

        mutation_variables = {
            "mediaIds": media_ids,
            "productId": product_id
        }

        mutation = """
            mutation productDeleteMedia($mediaIds: [ID!]!, $productId: ID!) {
                productDeleteMedia(mediaIds: $mediaIds, productId: $productId) {
                    deletedMediaIds
                    deletedProductImageIds
                    mediaUserErrors { code message }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(mutation, mutation_variables))
        check_for_errors(return_response["data"]["productDeleteMedia"], "Error deleting media from product.")
        return return_response["data"]

def bulk_create_shopify_variants(shop, product_id, variants, variant_media=None):
    """
    Creates product variants in bulk using Shopify's productVariantsBulkCreate mutation.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        location_id = get_location_id(shop)

        variables = {
            "productId": product_id,
            "variants": variants,
            "media": variant_media or [],
            "locationId": location_id
        }

        query = """
        mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $media: [CreateMediaInput!], $locationId: ID!) {
            productVariantsBulkCreate(productId: $productId, strategy: REMOVE_STANDALONE_VARIANT, variants: $variants, media: $media) {
                product { id }
                productVariants {
                    id
                    inventoryItem {
                        id
                        inventoryLevel (locationId: $locationId) {
                            id
                            quantities (names: ["available"]) {
                                quantity
                            }
                        }
                    }
                    metafields (first: 1) {
                        edges {
                            node {
                                key
                                value
                            }
                        }
                    }
                }
                userErrors { field message }
            }
        }
        """

        try:
            response = json.loads(GraphQL().execute(query, variables))
            data = response["data"]["productVariantsBulkCreate"]
            check_for_errors(data, "Error creating product variants.")
            return data
        except ShopifyLocationIdNotFound:
            location_id = get_location_id(shop, reset_location=True)
            variables["locationId"] = location_id
            response = json.loads(GraphQL().execute(query, variables))
            data = response["data"]["productVariantsBulkCreate"]
            check_for_errors(data, "Error creating product variants.")
            return data
        except Exception as e:
            logger.exception(f"Unexpected error while creating Shopify variants: {str(e)}")
            raise Exception(f"Unexpected error while creating Shopify variants: {str(e)}")

def create_shopify_variant(shop, product_id, variant):
    """
      Wrapper to create a single variant using the bulk mutation.
      Returns a minimal structure for a single variant.
    """
    location_id = get_location_id(shop)
    variant_data = get_variant_data(variant, location_id)
    media = [get_media_data(variant["image"])] if variant.get("image") else []

    response_data = bulk_create_shopify_variants(shop, product_id, [variant_data], media)

    product_variants = response_data.get("productVariants", [])
    if not product_variants:
        raise Exception("No variants were returned from Shopify.")

    variant = product_variants[0]
    inventory_item = variant.get("inventoryItem", {})
    inventory_level = inventory_item.get("inventoryLevel", {})

    return {
        "id": variant["id"],
        "inventory_item_id": inventory_item.get("id"),
        "inventory_level_id": inventory_level.get("id"),
    }
    
def replace_all_media(shop, imported_product):
    """
        Replace all the media in the product in Shopify.
    """
    delete_all_medias_from_product(shop, imported_product.shopify_product_id)
    medias = []
    result = []

    for variant in imported_product.imported_variants.all():
        if variant.image:
            medias.append(variant.image.url)

    for asset in imported_product.product.assets.all():
        medias.append(asset.image.url)

    if len(medias) > 0:
        created_medias = add_media_to_product(shop, imported_product.shopify_product_id, medias)
        for created_media in created_medias:
            result.append(created_media["id"])

    # Update the variant media
    count = 0
    for imported_variant in imported_product.imported_variants.all():
        if imported_variant.shopify_variant_id is not None:
            if imported_variant.image:
                payload = {}
                
                if count < len(result):
                    payload["mediaId"] = result[count]
                    count += 1

                update_shopify_variant(
                    shop, 
                    imported_product.shopify_product_id, 
                    imported_variant.shopify_variant_id, 
                    payload
                )

def get_shop_details(shop):
    """
        Retrieve the shop details from the Shopify store.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            {
                shop {
                    name
                    contactEmail
                    primaryDomain {
                        host
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query))
        return return_response["data"]["shop"]

def delete_shopify_variant(shop, variant_id, product_id):
    """
    Deletes a variant in the Shopify store using bulk mutation.

    Parameters:
    - variant_id (str): Shopify variant ID to delete.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        # Normalize to list if it's a single string
        if not isinstance(variant_id, list):
            variant_id = [variant_id]

        mutation_variables = {
            "productId": product_id,
            "variantsIds": variant_id
        }

        query = """
            mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
                productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
                    product {
                      id
                      title
                    }
                    userErrors {
                      field
                      message
                    }
                }
            }
        """

        response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(response["data"]["productVariantsBulkDelete"], "Error deleting variant(s).")
        return True

def get_fulfillment_order(shop, order_id):
    
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        location_id = get_location_id(shop)
        
        query_variables = {
            "orderId": order_id,
            "locationId": location_id
        }

        location_id = location_id.split('/')[-1]
        location_query = f"assigned_location_id:{location_id}"

        query = """
            query($orderId: ID!) {
                order(id: $orderId) {
                    fulfillmentOrders(first: 5, query: "%s") {
                        edges {
                            node {
                                id
                                status

                                lineItems(first: 10) {
                                    edges {
                                        node {
                                            id
                                            sku
                                            productTitle
                                            totalQuantity
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        """ % location_query

        return_response = json.loads(GraphQL().execute(query, query_variables))
        
        fulfillmentOrders = return_response["data"]["order"]["fulfillmentOrders"]
        try:
            total = len(fulfillmentOrders["edges"]) if fulfillmentOrders else 0
            logger.info(f"[FULFILLMENT] Fulfillment orders fetched: total_edges={total}")
        except Exception:
            pass
        
        if len(fulfillmentOrders["edges"]) == 0:
            return None, None
        
        for fulfillmentOrder in fulfillmentOrders["edges"]:
            
            if fulfillmentOrder["node"]["status"] == "OPEN":
                line_items = fulfillmentOrder["node"]["lineItems"]["edges"]
                line_items = [line_item["node"] for line_item in line_items]
                return fulfillmentOrder["node"]["id"], line_items
        
        return None, None
    
def create_fulfillment(shop, fulfillment_order_id, sub_order_id, line_item_ids):
    sub_order = SubOrder.objects.get(id=sub_order_id)
    
    

    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        fulfillment_input = {
            "lineItemsByFulfillmentOrder": {
                "fulfillmentOrderId": fulfillment_order_id,
                "fulfillmentOrderLineItems": line_item_ids
            }
        }

        tracking_info = {}
        if sub_order.tracking_carrier:
            tracking_info["company"] = sub_order.tracking_carrier
        if sub_order.tracking_number:
            tracking_info["number"] = sub_order.tracking_number
        if sub_order.tracking_link:
            tracking_info["url"] = sub_order.tracking_link

        if tracking_info:
            fulfillment_input["trackingInfo"] = tracking_info
        else:
            logger.info("[FULFILLMENT] No tracking info provided")

        mutation_variables = {
            "fulfillment": fulfillment_input
        }

        
        query = """
            mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
                fulfillmentCreateV2(fulfillment: $fulfillment) {
                    userErrors {
                        field
                        message
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(return_response["data"]["fulfillmentCreateV2"], "Error creating fulfillment.")
        
        

def create_fulfillment_without_suborder(shop, fulfillment_order_id):
    """
    Create a fulfillment for a fulfillment order without relying on internal SubOrder records.
    This fulfills all line items in the fulfillment order and omits tracking info.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        # Fetch line items for the fulfillment order
        query = """
            query($id: ID!) {
                fulfillmentOrder(id: $id) {
                    id
                    status
                    lineItems(first: 50) {
                        edges {
                            node {
                                id
                                totalQuantity
                            }
                        }
                    }
                }
            }
        """
        query_variables = {"id": fulfillment_order_id}
        resp = json.loads(GraphQL().execute(query, query_variables))
        if resp.get("errors") and not resp.get("data"):
            logger.error(f"[FULFILLMENT] fulfillmentOrder query errors: {resp.get('errors')}")
            raise Exception(f"Shopify GraphQL error: {resp.get('errors')}")
        try:
            edges = ((resp.get("data") or {}).get("fulfillmentOrder") or {}).get("lineItems", {}).get("edges", [])
        except Exception:
            edges = []
        line_item_ids = [{"id": e["node"]["id"], "quantity": e["node"]["totalQuantity"]} for e in edges]

        mutation = """
            mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
                fulfillmentCreateV2(fulfillment: $fulfillment) {
                    userErrors { field message }
                }
            }
        """
        variables = {
            "fulfillment": {
                "lineItemsByFulfillmentOrder": {
                    "fulfillmentOrderId": fulfillment_order_id,
                    "fulfillmentOrderLineItems": line_item_ids
                }
            }
        }
        res = json.loads(GraphQL().execute(mutation, variables))
        if res.get("errors") and not res.get("data"):
            logger.error(f"[FULFILLMENT] fulfillmentCreateV2 mutation errors: {res.get('errors')}")
            raise Exception(f"Shopify GraphQL error: {res.get('errors')}")
        check_for_errors(res["data"]["fulfillmentCreateV2"], "Error creating fulfillment without suborder.")

def get_all_fulfillment_services(shop):
    """
        Retrieve all the fulfillment services in the Shopify store.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            {
                shop {
                    myshopifyDomain

                    fulfillmentServices {
                        id
                        serviceName
                        location {
                            id
                        }
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query))
        shop_data = return_response["data"]["shop"]
        return shop_data["myshopifyDomain"], shop_data["fulfillmentServices"]
    
def get_product_variants(shop, product_id, location_id):
    """
        Retrieve the product variants from the Shopify store.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query_variables = {
            "id": product_id,
            "locationId": location_id,
        }

        query = """
            query ProductVariants($id: ID!, $locationId: ID!) {
                product(id: $id) {
                    variants(first: 20) {
                        edges {
                            node {
                                id
                                inventoryItem {
                                    id
                                    inventoryLevel(locationId: $locationId) { id }
                                }
                            }
                        }
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, query_variables))
        edges = return_response["data"]["product"]["variants"]["edges"]
        variants = []

        for edge in edges:
            variants.append({
                "id": edge["node"]["id"],
                "inventory_item_id": edge["node"]["inventoryItem"]["id"],
                "inventory_level_id": edge["node"]["inventoryItem"]["inventoryLevel"]["id"],
            })
        
        return variants

def get_publications(shop):
    """
    Get the publications/channels from the Shopify store.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            query publications {
                publications(first: 10) {
                    edges {
                        node {
                            id
                            name
                        }
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query))
        return return_response["data"]

def push_item_to_publication(shop, publication_id, product_id):
    """
    Push the product to the publication/channel.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        mutation_variables = {
            "id": product_id,
            "input": {
                "publicationId": publication_id
            }
        }

        query = """
            mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
                publishablePublish(id: $id, input: $input) {
                    userErrors {
                        field
                        message
                    }
                }
            }
        """

        return_response = json.loads(GraphQL().execute(query, mutation_variables))
        check_for_errors(return_response["data"]["publishablePublish"], "Error pushing product to publication.")
        return return_response["data"]
    
def publish_product_to_online_store(shop, product_id):
    """
    Publish the product to the Shopify store channels.
    """
    publications = get_publications(shop)
    for publication in publications["publications"]["edges"]:
        if publication["node"]["name"] == "Online Store":
            push_item_to_publication(shop, publication["node"]["id"], product_id)

def create_dropship_settings(user, shop):
    """
    Create the dropshipping settings for the user and shop.
    """
    dropshipping_settings = DropshipSettings.objects.create(user=user, shop=shop)

    if shop is not None:
        # Get the shop details and set the invoice store name, contact email, and website
        shop_details = get_shop_details(shop)
        dropshipping_settings.invoice_store_name = shop_details["name"]
        dropshipping_settings.invoice_contact_email = shop_details["contactEmail"]
        dropshipping_settings.invoice_website = shop_details["primaryDomain"]["host"]
        dropshipping_settings.save()

    return dropshipping_settings

class ImportedProductService:
    @staticmethod
    def delete_imported_products(user, product_ids):
        responses = []

        for product_id in product_ids:
            response = ImportedProductService.delete_imported_product(user, product_id)
            responses.append(response)
        return responses
    @staticmethod
    def update_imported_products(user, products):
        responses = []

        for product in products:
            product_id = product.get('product_id')
            response = ImportedProductService.update_imported_product(user, product_id, product)
            responses.append(response)
        return responses

    @staticmethod
    def delete_imported_product(user, product_id):
        imported_products = ImportedProduct.get_by_user(user)

        try:
            shop = Shop.objects.get_by_user_id(user.id)
        except Shop.DoesNotExist:
            shop = None

        imported_product = imported_products.filter(
            product_id=product_id
        ).first()

        if not imported_product:
            return ResponseError.product_not_imported()
        
        if imported_product.shopify_product_id is not None:
            try:
                delete_shopify_product(shop, imported_product.shopify_product_id)
            except Exception as e:
                print(f"Error deleting Shopify product: {e}")

        imported_product.delete()

        return Response({"message": "Deleted successfully"}, status=status.HTTP_200_OK)

    @staticmethod
    def update_imported_product(user, product_id, data):
        imported_products = ImportedProduct.get_by_user(user)
        shopify_payload = {}
        try:
            shop = Shop.objects.get_by_user_id(user.id)
            subscription = Subscription.objects.filter(
                user=user, status=ActiveStatus.ACTIVE
            ).first()
        except Shop.DoesNotExist:
            return ResponseError.shop_not_found()

        if subscription is None and not settings.DISABLE_PAYMENTS:
            return ResponseError.subscription_not_found()

        imported_product = imported_products.filter(
            product_id=product_id
        ).first()
        if not imported_product:
            return ResponseError.product_not_imported()

        serializer = ImportedProductUpdateSerializer(data=data)

        if not serializer.is_valid():
            return ResponseError.serializer_error(serializer.errors)

        has_shopify_product = imported_product.shopify_product_id is not None

        if serializer.data.get("title"):
            imported_product.product.title = serializer.data.get("title")
            imported_product.product.save()

            if has_shopify_product:
                shopify_payload["title"] = imported_product.product.title

        if serializer.data.get("description"):
            imported_product.description = serializer.data.get("description")

            if has_shopify_product:
                shopify_payload["descriptionHtml"] = imported_product.description

        if "tags" in serializer.data:
            imported_product.tags = serializer.data.get("tags", [])

            if has_shopify_product:
                shopify_payload["tags"] = imported_product.tags

        if serializer.data.get("collections") is not None:
            if has_shopify_product:
                new_collections = set(serializer.data.get("collections", []))
                existing_collections = set(imported_product.collections or [])

                collections_to_leave = existing_collections - new_collections
                collections_to_join = new_collections - existing_collections

                if collections_to_leave:
                    shopify_payload["collectionsToLeave"] = list(collections_to_leave)

                if collections_to_join:
                    shopify_payload["collectionsToJoin"] = list(collections_to_join)

                if not new_collections and existing_collections:
                    shopify_payload["collectionsToLeave"] = list(existing_collections)

            imported_product.collections = serializer.data.get("collections", [])

        if imported_product.is_live is False and serializer.data.get("is_live"):
            if imported_product.product.is_premium and not settings.DISABLE_PAYMENTS:
                premium_products_limit = subscription.plan.limits.get(
                    "premium_products"
                )
                if premium_products_limit == 0:
                    return ResponseError.premium_product_not_allowed()

                total_premium_products = imported_products.filter(
                    is_live=True, product__is_premium=True
                ).count()
                if total_premium_products >= premium_products_limit:
                    return ResponseError.limit_exceeded_for_premium_products()

            total_live_products = imported_products.filter(is_live=True).count()
            if total_live_products >= subscription.plan.limits.get("live_products") and not settings.DISABLE_PAYMENTS:
                return ResponseError.limit_exceeded_for_live_products()

            if has_shopify_product:
                shopify_payload["status"] = "ACTIVE"
            else:
                shopify_product_id = create_shopify_product(
                    shop, ImportedProductSerializer(imported_product).data
                )
                imported_product.shopify_product_id = shopify_product_id
                product_id = shopify_product_id.split("/")[-1]
                shop_name = shop.url.split(".")[0]
                imported_product.shopify_product_link = (
                    f"https://admin.shopify.com/store/{shop_name}/products/{product_id}"
                )

                try:
                    publish_product_to_online_store(shop, shopify_product_id)
                except Exception as e:
                    logger.error(e)

            imported_product.is_live = True
            imported_product.live_at = datetime.now()

        if imported_product.is_live is True and serializer.data.get("is_live") is False:
            shopify_payload["status"] = "ARCHIVED"
            imported_product.is_live = False
            imported_product.live_at = None

        if has_shopify_product:
            try:
                update_shopify_product(shop, imported_product.shopify_product_id, shopify_payload)
            except ShopifyProductNotFoundError:
                imported_product.shopify_product_id = None

        imported_product.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @staticmethod
    def sync_product_variants(user, product_id, variants):
        imported_products = ImportedProduct.get_by_user(user)
        try:
            shop = Shop.objects.get_by_user_id(user.id)
        except Shop.DoesNotExist:
            shop = None

        imported_product = imported_products.filter(product_id=product_id).first()
        if not imported_product:
            raise Exception({"message": "Product not imported."})

        has_shopify_product = imported_product.shopify_product_id is not None and shop is not None

        for variant in variants:
            imported_variant = None
            if variant["imported_variant_id"] is not None:
                imported_variant = ImportedVariant.objects.filter(imported_product=imported_product, id=variant["imported_variant_id"]).first()

            if imported_variant is None:
                imported_variant = ImportedVariant.objects.create(imported_product=imported_product, variant_id=variant["id"])

            imported_variant.is_active = variant["is_active"]

            if has_shopify_product:
                if variant["is_active"] is False and imported_variant.shopify_variant_id is not None:
                    delete_shopify_variant(shop, imported_variant.shopify_variant_id, product_id=imported_product.shopify_product_id)
                elif variant["is_active"] is True and imported_variant.shopify_variant_id is None:
                    data = create_shopify_variant(shop, imported_product.shopify_product_id, VariantSerializer(variant).data)
                    imported_variant.shopify_variant_id = data["id"]
                    imported_variant.shopify_inventory_item_id = data["inventory_item_id"]
                    imported_variant.shopify_inventory_level_id = data["inventory_level_id"]
                    imported_variant.shopify_available_quantity = variant["inventory_quantity"]

            imported_variant.save()


def get_image_description(file_id: int) -> str | Response:
    image_description = ImageDescription.objects.filter(file_id=file_id).first()

    if image_description is not None:
        return image_description.description

    file = File.objects.filter(id=file_id).first()

    if file is None:
        return ResponseError.search_image_not_found()

    ai_manager = AIManager([OpenAIProvider()])
    img_content = requests.get(file.url).content
    img_data = base64.b64encode(img_content).decode('utf-8')
    img_bytes = io.BytesIO(img_content)
    img_bytes.seek(0)

    img = Image.open(img_bytes)
    img_width, img_height = img.size
    tile_width = 512
    tile_height = 512
    max_tiles = 2

    tiles_count = math.ceil(img_width / tile_width) * math.ceil(img_height / tile_height)

    if tiles_count > max_tiles:
        scaling_factor = (max_tiles * tile_width * tile_height) / (img_width * img_height)
        new_width = int(img_width * scaling_factor)
        new_height = int(img_height * scaling_factor)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        img_data = base64.b64encode(img_bytes.getvalue()).decode('utf-8')

    description = ai_manager.text(
        [("system", IMAGE_SEARCH_PROMPT),
         HumanMessage(content=[
             {"type": "image_url",
              "image_url": {"url": f"data:image/jpeg;base64,{img_data}"}
              }
         ])
         ],
        options={
            "temperature": 0.5,
        }
    )

    ImageDescription.objects.create(
        file=file,
        description=description
    )

    return description


def assigned_fulfillment_orders(shop: Shop):
    """
    Get assigned fulfillment orders from Shopify for the given shop.
    """
    
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            {
                shop {
                    assignedFulfillmentOrders(first: 10, assignmentStatus: FULFILLMENT_REQUESTED) {
                        edges {
                            node {
                                id
                                status
                                requestStatus
                                order {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        """
        
        return_response = json.loads(GraphQL().execute(query))
        return return_response["data"]


def accept_fulfillment_request(shop: Shop, fulfillment_order_id: str):
    """
    Accept a fulfillment request for the given fulfillment order.
    """
    
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        # First check if we need to accept it
        status_query = """
            query getFulfillmentOrder($id: ID!) {
                fulfillmentOrder(id: $id) {
                    id
                    status
                    requestStatus
                }
            }
        """
        status_variables = {"id": fulfillment_order_id}
        status_response = json.loads(GraphQL().execute(status_query, status_variables))
        
        if status_response.get("errors"):
            logger.error(f"[FULFILLMENT] Error getting fulfillment order status: {status_response.get('errors')}")
        else:
            fo_status = status_response.get("data", {}).get("fulfillmentOrder", {})
            if fo_status:
                status = fo_status.get("status")
                request_status = fo_status.get("requestStatus")
                
                # If already accepted or in progress, no need to accept again
                if status in ["IN_PROGRESS", "CLOSED", "CANCELLED"]:
                    logger.info(f"[FULFILLMENT] Fulfillment order already in status {status}, skipping accept")
                    return {"fulfillmentOrder": {"status": status}}
        
        logger.info(f"[FULFILLMENT] Accepting fulfillment request: fulfillment_order_id={fulfillment_order_id}")
        
        mutation = """
            mutation acceptFulfillmentRequest {
                fulfillmentOrderAcceptFulfillmentRequest(
                    id: "%s", 
                    message: "Fulfillment request accepted.") {
                    fulfillmentOrder {
                        id
                        status
                        requestStatus
                    }
                }
            }
        """ % fulfillment_order_id
        
        return_response = json.loads(GraphQL().execute(mutation))
        
        # Check for GraphQL errors
        if return_response.get("errors"):
            logger.error(f"[FULFILLMENT] fulfillmentOrderAccept errors: {return_response.get('errors')}")
            raise Exception(f"Shopify GraphQL error: {return_response.get('errors')}")
            
        return return_response
        
        


def get_shopify_order_by_fulfillment_order_id(shop: Shop, fulfillment_order_id: str):
    """
    Get Shopify order details by fulfillment order ID.
    """
    
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query_variables = {
            "id": fulfillment_order_id
        }
        
        
        query = """
            query fulfillmentOrder($id: ID!) {
                fulfillmentOrder(id: $id) {
                    id
                    status
                    order {
                        id
                        name
                    }
                }
            }
        """
        
        return_response = json.loads(GraphQL().execute(query, query_variables))
        return return_response["data"]

def assigned_fulfillment_orders_with_cancellation_requests(shop: Shop):
    """
    Get assigned fulfillment orders that have pending cancellation requests.
    """
    with Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        query = """
            { shop { assignedFulfillmentOrders(first: 20) { edges { node { id status cancellationRequests(first: 10) { edges { node { id reason status } } } } } } } }
        """
        resp = json.loads(GraphQL().execute(query))
        try:
            edges = resp["data"]["shop"]["assignedFulfillmentOrders"]["edges"]
            filtered = [e for e in edges if e["node"].get("cancellationRequests", {}).get("edges")]
            resp["data"]["shop"]["assignedFulfillmentOrders"]["edges"] = filtered
        except Exception:
            pass
        return resp
