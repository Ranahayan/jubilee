from .services import get_product_list_for_shop, get_product_detail_from_id, get_shopify_collections
from authentication.models import Shop

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status


class GetProductsView(APIView):
    def get(self, request):
        shop = Shop.objects.get_by_user(request.user)
        if not shop:
            return Response({"error": "This user has no shop"}, status=status.HTTP_404_NOT_FOUND)
        
        products = get_product_list_for_shop(shop)

        return Response(products.data, status=status.HTTP_200_OK)
    

class GetProductDetailView(APIView):
    def get(self, request, product_id):
        shop = Shop.objects.get_by_user(request.user)
        if not shop:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        product = get_product_detail_from_id(shop, product_id)

        return Response(product.data, status=status.HTTP_200_OK)


class GetCollectionsView(APIView):
    def get(self, request):
        shop = Shop.objects.get_by_user(request.user)
        if not shop:
            return Response(status=status.HTTP_404_NOT_FOUND)

        collections = get_shopify_collections(shop)

        return Response(collections, status=status.HTTP_200_OK)
