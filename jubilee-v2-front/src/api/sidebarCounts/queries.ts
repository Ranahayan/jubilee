import { useQuery } from "@tanstack/react-query";
import { 
  SIDEBAR_COUNT_LIVE_PRODUCTS,
  SIDEBAR_COUNT_IMPORTED_PRODUCTS,
  SIDEBAR_COUNT_SAMPLE_ORDERS,
  SIDEBAR_COUNT_SHOPIFY_ORDERS,
  ISidebarCount
} from "./types";
import {
  getSidebarCountLiveProducts,
  getSidebarCountImportedProducts,
  getSidebarCountSampleOrders,
  getSidebarCountShopifyOrders
} from "./requests";

export const useGetSidebarCountLiveProducts = () =>
  useQuery<ISidebarCount>(SIDEBAR_COUNT_LIVE_PRODUCTS, () => getSidebarCountLiveProducts());

export const useGetSidebarCountImportedProducts = () =>
  useQuery<ISidebarCount>(SIDEBAR_COUNT_IMPORTED_PRODUCTS, () => getSidebarCountImportedProducts());

export const useGetSidebarCountSampleOrders = () => 
  useQuery<ISidebarCount>(SIDEBAR_COUNT_SAMPLE_ORDERS, () => getSidebarCountSampleOrders());

export const useGetSidebarCountShopifyOrders = () => 
  useQuery<ISidebarCount>(SIDEBAR_COUNT_SHOPIFY_ORDERS, () => getSidebarCountShopifyOrders());

