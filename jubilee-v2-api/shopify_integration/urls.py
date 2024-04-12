from django.urls import path
from shopify_integration.views import GetProductDetailView, GetProductsView, GetCollectionsView

urlpatterns = [
    path("products/", GetProductsView.as_view(), name="get_products"),
    path('product/<int:product_id>/', GetProductDetailView.as_view(), name='get_product_details'),
    path("collections/", GetCollectionsView.as_view(), name="get_collections"),
]