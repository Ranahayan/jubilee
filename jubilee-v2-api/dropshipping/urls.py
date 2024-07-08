from django.urls import path
from .views import (
    BrandSettingsView,
    CancelSuborder,
    BulkImportedProductListDetail,
    CategoryList,
    GetBulkCheckoutSummary,
    ProductList,
    ImportedProductList,
    ImportedProductListDetail,
    UpdateImportedVariant,
    SampleOrder,
    UpdateOrderAddress,
    OrderList,
    DropshippingSettings,
    SubOrderCheckout,
    branded_product_editor_view,
    invoice_view,
    invoice_preview_view,
    FulfillmentOrder,
    SidebarCountLiveProducts,
    SidebarCountImportedProducts,
    SidebarCountSampleOrders,
    SidebarCountShopifyOrders,
    CreateProductAssets,
    ProductAssetsDetails,
    BulkUpdateImportedVariant,
)
from .webhooks import fulfillment_order_notification

urlpatterns = [
    path("categories/", CategoryList.as_view(), name="category-list"),
    path("products/", ProductList.as_view(), name="product-list"),
    path(
        "imported-products/",
        ImportedProductList.as_view(),
        name="imported-product-list",
    ),
    path(
        "imported-products/<int:product_id>/",
        ImportedProductListDetail.as_view(),
        name="imported-product-detail",
    ),
    path(
        "imported-products/bulk/",
        BulkImportedProductListDetail.as_view(),
        name="imported-product-detail-bulk",
    ),
    path(
        "imported-products/update-variant/<int:variant_id>/",
        UpdateImportedVariant.as_view(),
        name="update-imported-variant",
    ),
    path(
        "orders/cancel/<int:sub_order_id>/",
        CancelSuborder.as_view(),
        name="cancel-suborder",
    ),
    path("orders/", OrderList.as_view(), name="order-list"),
    path(
        "orders/update-address/<int:order_id>/",
        UpdateOrderAddress.as_view(),
        name="update-order-address",
    ),
    path("sample-order/<int:variant_id>/", SampleOrder.as_view(), name="sample-order"),
    path("settings/", DropshippingSettings.as_view(), name="dropshipping-settings"),
    path(
        "checkout/<int:sub_order_id>/",
        SubOrderCheckout.as_view(),
        name="suborder-checkout",
    ),
    path("invoice/<int:sub_order_id>/", invoice_view, name="suborder-invoice"),
    path(
        "invoice/preview/<str:user_id>/", invoice_preview_view, name="invoice-preview"
    ),
    path(
        "fulfillment-order/<int:sub_order_id>/",
        FulfillmentOrder.as_view(),
        name="fulfillment-order",
    ),
    path(
        "sidebar-count/live-products/",
        SidebarCountLiveProducts.as_view(),
        name="sidebar-count-live-products",
    ),
    path(
        "sidebar-count/imported-products/",
        SidebarCountImportedProducts.as_view(),
        name="sidebar-count-imported-products",
    ),
    path(
        "sidebar-count/sample-orders/",
        SidebarCountSampleOrders.as_view(),
        name="sidebar-count-sample-orders",
    ),
    path(
        "sidebar-count/shopify-orders/",
        SidebarCountShopifyOrders.as_view(),
        name="sidebar-count-shopify-orders",
    ),
    path('branded-product-editor/', branded_product_editor_view, name='branded-product-editor'),
    path('brand-settings/<int:variant_id>/', BrandSettingsView.as_view(), name='brand-settings'),
    path("product-assets/", CreateProductAssets.as_view(), name="product-assets"),
    path("product-assets/<int:asset_id>/", ProductAssetsDetails.as_view(), name="product-assets"),
    path("imported-variants/bulk/", BulkUpdateImportedVariant.as_view(), name="update-imported-variants-bulk"),
    path(
      "bulk-checkout-summary/",
      GetBulkCheckoutSummary.as_view(),
      name="bulk-checkout-summary"
    ),
    path(
      "fulfillment_order_notification",
      fulfillment_order_notification,
      name="fulfillment_order_notification"
    ),
]
