import { IProduct, IProductParams, ImportProduct } from "~/types/dropshipping";
import { sendDelete, sendGet, sendPost, sendPut } from "../base";
import { getAPIData } from "../helpers";
import {
  IAddressParams,
  ICreateSampleOrderParams,
  IOrdersParams,
  IPushToStoreParams,
  IUpdateRetailPriceParams,
  ImportListParams,
  IDropshippingSettings,
  IUserCategories,
  IProductAssetPayload,
  IProductVariantsPayload,
} from "./types";

export const getProducts = (params?: IProductParams) =>
  getAPIData(sendGet("dropshipping/products/", params));

export const getCategories = () =>
  getAPIData(sendGet("dropshipping/categories/"));

export const updateCategoriesByUser = (params: IUserCategories) =>
  getAPIData(sendPut(`dropshipping/categories/`, params));

export const addToImportList = (product_id: string) =>
  getAPIData(sendPost(`dropshipping/imported-products/${product_id}/`));

export const getImportList = (params?: ImportListParams) =>
  getAPIData(sendGet(`dropshipping/imported-products/`, params));

export const deleteImportedProduct = (product_id: string) =>
  getAPIData(
    sendDelete(`dropshipping/imported-products/${product_id}`, product_id)
  );

export const pushToStore = (params: IPushToStoreParams) =>
  getAPIData(
    sendPut(`dropshipping/imported-products/${params.product_id}`, params)
  );

export const getOrders = (params?: IOrdersParams) =>
  getAPIData(sendGet(`dropshipping/orders/`, params));

export const updateAddress = (params: IAddressParams) =>
  getAPIData(
    sendPut(`dropshipping/orders/update-address/${params.order_id}/`, params)
  );

export const createSampleOrder = (params: ICreateSampleOrderParams) =>
  getAPIData(
    sendPost(`dropshipping/sample-order/${params.variant_id}/`, params)
  );

export const deleteSampleOrder = (params: ICreateSampleOrderParams) =>
  getAPIData(sendDelete(`dropshipping/sample-order/${params.variant_id}/`, {}));

export const checkoutOrder = (sub_order_id: number) =>
  getAPIData(sendPost(`dropshipping/checkout/${sub_order_id}/`));

export const updateRetailPrice = (params: IUpdateRetailPriceParams) =>
  getAPIData(
    sendPut(
      `dropshipping/imported-products/update-variant/${params.variant_id}/`,
      params
    )
  );

export const getDropshippingSettings = () =>
  getAPIData(sendGet("dropshipping/settings/"));

export const updateDropshippingSettings = (params: IDropshippingSettings) =>
  getAPIData(sendPost("dropshipping/settings/", params));

export const updateBackgroundColor = (backgroundColor: string) =>
  getAPIData(
    sendPost("dropshipping/settings/", {
      products_background_color: backgroundColor,
    })
  );

export const updateImportProductColor = (params: IPushToStoreParams) =>
  getAPIData(
    sendPut(`dropshipping/imported-products/${params.product_id}`, params)
  );
export const cancelSubOrder = (sub_order_id: number) => getAPIData(sendPost(`dropshipping/orders/cancel/${sub_order_id}/`));

export const getBulkCheckoutSummary = (subOrderIds: number[] = [], orderType: string) => 
	getAPIData(sendGet(`dropshipping/bulk-checkout-summary/`, { ids: subOrderIds.join(","), order_type: orderType }));

export const updateImportListBulk = (params: {
  products: IPushToStoreParams[];
}) => getAPIData(sendPut("dropshipping/imported-products/bulk/", params));

export const deleteImportedProductBulk = (params: { product_ids: string[] }) =>
  getAPIData(sendPost("dropshipping/imported-products/bulk/", params));

export const updateImportedProduct = (params: Partial<IProduct>) => {
  const { id, ...rest } = params;
  return getAPIData(sendPut(`dropshipping/imported-products/${id}/`, rest));
};

export const createProductAsset = (params: IProductAssetPayload) => {
  return getAPIData(sendPost("dropshipping/product-assets/", params));
};

export const updateProductAsset = (params: IProductAssetPayload) => {
  const { id, ...rest } = params;
  return getAPIData(sendPut(`dropshipping/product-assets/${id}`, rest));
};

export const deleteProductAsset = (assetId: number) => {
  return getAPIData(sendDelete(`dropshipping/product-assets/${assetId}`, {}));
};

export const bulkUpdateVariants = (params: IProductVariantsPayload) => {
  return getAPIData(sendPost("dropshipping/imported-variants/bulk/", params));
};
