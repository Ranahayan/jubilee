import { sendGet, sendPost } from "~/api/base";
import { getAPIData } from "../helpers";
import { IStoreConnect, IStoreLoginRequest } from "./types";

export const getStoreInfo = () => getAPIData(sendGet("shop/"));

export const storeLogin = (params: IStoreLoginRequest) =>
  getAPIData(sendPost("shop_login/", params));

export const storeConnect = (params: IStoreConnect) =>
  getAPIData(sendPost("connect/shopify/", params));

export const getShopifyProducts = () =>
  getAPIData(sendGet("shopify/products/"));

  export const getShopifyCollections = () =>
  getAPIData(sendGet("shopify/collections/"));
