import { sendGet } from "../base";
import { getAPIData } from "../helpers";

export const getSidebarCountLiveProducts = () => getAPIData(sendGet("dropshipping/sidebar-count/live-products/"));

export const getSidebarCountImportedProducts = () => getAPIData(sendGet("dropshipping/sidebar-count/imported-products/"));

export const getSidebarCountSampleOrders = () => getAPIData(sendGet("dropshipping/sidebar-count/sample-orders/"));

export const getSidebarCountShopifyOrders = () => getAPIData(sendGet("dropshipping/sidebar-count/shopify-orders/"));
