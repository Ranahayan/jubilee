from rest_framework.response import Response
from rest_framework import status
from enum import Enum


class ErrorCode(Enum):
    REQUIRES_UPGRADE = 1

class ShopifyLocationIdNotFound(Exception):
    pass

class ShopifyProductNotFound(Exception):
    pass
class ShopifyTrialAccountError(Exception):
    pass

class ShopifyProductNotFoundError(Exception):
    pass

class ResponseError:
    @classmethod
    def get_data(cls, message, error_code=None):
        return {"message": message, "error_code": error_code}

    @classmethod
    def shop_not_found(cls):
        return Response(
            cls.get_data("Shop doesn't exist"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def invalid_category(cls):
        return Response(
            cls.get_data("Category doesn't exist"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def page_is_invalid(cls):
        return Response(
            cls.get_data("The page value is not valid"),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def serializer_error(cls, errors):
        return Response(errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @classmethod
    def internal_error(cls, msg):
        return Response(cls.get_data(msg), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @classmethod
    def product_already_imported(cls):
        return Response(
            cls.get_data("Product already imported"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def product_not_imported(cls):
        return Response(
            cls.get_data("Product not imported"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def variant_not_found(cls):
        return Response(
            cls.get_data("Variant doesn't exist"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def invalid_quantity(cls):
        return Response(
            cls.get_data("Invalid quantity"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def suborder_not_found(cls):
        return Response(
            cls.get_data("Suborder doesn't exist"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def order_not_found(cls):
        return Response(
            cls.get_data("Order doesn't exist"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def suborder_already_paid(cls):
        return Response(
            cls.get_data("Suborder already paid"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def suborder_has_inactive_products(cls, inactive_product_titles):
        return Response(
            cls.get_data("Suborder has inactive products: " + ", ".join(inactive_product_titles)),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def payment_method_not_found(cls):
        return Response(
            cls.get_data("Payment method doesn't exist"),
            status=status.HTTP_404_NOT_FOUND,
        )

    @classmethod
    def address_not_found(cls):
        return Response(
            cls.get_data("Address doesn't exist"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def country_is_required(cls):
        return Response(
            cls.get_data("Country is required"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def shipping_not_available(cls):
        return Response(
            cls.get_data("Shipping is not available to this country"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def limit_exceeded_for_live_products(cls):
        return Response(
            cls.get_data(
                "Limit exceeded for live products", ErrorCode.REQUIRES_UPGRADE.value
            ),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def subscription_not_found(cls):
        return Response(
            cls.get_data(
                "User does not have an active subscription.",
                ErrorCode.REQUIRES_UPGRADE.value,
            ),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def product_not_found(cls):
        return Response(
            cls.get_data("Product doesn't exist"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def limit_exceeded_for_premium_products(cls):
        return Response(
            cls.get_data(
                "Limit exceeded for premium products", ErrorCode.REQUIRES_UPGRADE.value
            ),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def premium_product_not_allowed(cls):
        return Response(
            cls.get_data(
                "Premium products not allowed. Upgrade your plan to use this feature",
                ErrorCode.REQUIRES_UPGRADE.value,
            ),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def allowed_only_for_shopify_orders(cls):
        return Response(
            cls.get_data("This feature is allowed only for Shopify orders"),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @classmethod
    def brand_settings_not_found(cls):
        return Response(
            cls.get_data("Brand settings not found"),
            status=status.HTTP_404_NOT_FOUND
        )
    
    @classmethod
    def customized_background_not_allowed(cls):
        return Response(
            cls.get_data("Customized background not allowed. Upgrade your plan to use this feature"),
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @classmethod
    def fulfillment_order_not_found(cls):
        return Response(
            cls.get_data(
                "Is not possible to create a fulfillment order, probably the order is already fulfilled"
            ),
            status=status.HTTP_404_NOT_FOUND,
        )

    @classmethod
    def payment_intent_failed(cls):
        return Response(
            cls.get_data("We couldn't process your payment. Please try again with a different payment method."),
            status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def moq_not_met(cls, title, moq):
        return Response(
            cls.get_data(f"Checkout failed. The MOQ for {title} is {moq} units. Please adjust the quantity and try again."),
            status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def suborder_not_unpaid(cls):
        return Response(
            cls.get_data("Suborder is not unpaid"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def search_image_not_found(cls):
        return Response(
            cls.get_data("Search image not found"), status=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def search_image_too_big(cls):
        return Response(
            cls.get_data("Search image is too big"), status=status.HTTP_400_BAD_REQUEST
        )

    @classmethod
    def shopify_trial_account(cls):
        return Response(
            cls.get_data(
                "Shopify trial accounts do not support this feature. Please upgrade your Shopify account."
            ),
            status=status.HTTP_400_BAD_REQUEST
        )
