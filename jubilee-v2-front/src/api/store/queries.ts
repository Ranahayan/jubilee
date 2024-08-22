import { getShopifyProducts, getStoreInfo, getShopifyCollections } from "../store/requests";
import { useQuery } from "@tanstack/react-query";
import { STORE, SHOPIFY_PRODUCTS, SHOPIFY_COLLECTIONS } from "./types";

export const useGetStoreInfo = () => useQuery(STORE, () => getStoreInfo());

export const useGetShopifyProducts = () =>
  useQuery(SHOPIFY_PRODUCTS, () => getShopifyProducts());

export const useShopifyCollections = () =>
  useQuery(SHOPIFY_COLLECTIONS, () => getShopifyCollections());
