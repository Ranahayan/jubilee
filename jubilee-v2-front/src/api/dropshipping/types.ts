import { Order, OrderType } from "~/types/dropshipping";

export const PRODUCTS = ["PRODUCTS"];
export const IMPORT_LIST = ["IMPORT_LIST"];
export const ORDERS = ["ORDERS"];
export const DROPSHIPPING_SETTINGS = ["DROPSHIPPING_SETTINGS"];
export const BULK_CHECKOUT_SUMMARY = ["BULK_CHECKOUT_SUMMARY"];

export enum ImportListFilter {
	LOW_STOCK = "low_stock",
	OUT_STOCK = "out_of_stock",
}

export interface ImportListParams {
	page?: number;
	is_live?: boolean;
	filter?: ImportListFilter[] | string;
	search_term?: string;
};

export interface IPushToStoreParams {
  product_id: string;
  is_live?: boolean;
  description?: string;
  background_color?: string;
}

export interface IOrdersParams {
	page?: number;
	order_type?: OrderType;
	search_term?: string;
};

export interface IOrdersList {
  data: Order[];
  page: number;
  total_pages: number;
}

export interface IAddressParams {
  first_name: string;
  last_name: string;
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone?: string;
  order_id?: number;
}

export interface ICreateSampleOrderParams {
  quantity?: number;
  additive?: boolean;
  variant_id: number;
}

export interface IUpdateRetailPriceParams {
  retail_price_cents: number;
  variant_id: number;
}

export interface IDropshippingSettings {
  shop?: number;
  brand_name?: string;
  brand_logo?: number | string;
  invoice_store_name?: string;
  invoice_contact_email?: string;
  invoice_website?: string;
  invoice_logo?: number | string;
  invoice_body?: string;
  font_family?: string;
  products_background_color?: string;
  distributor_city?: string;
  distributor_zip?: string;
  language?: string;
}

export interface IUserCategories {
  categories: string[];
	brand_name?: string;
	brand_logo?: number | string;
	invoice_store_name?: string;
	invoice_contact_email?: string;
	invoice_website?: string;
	invoice_logo?: string;
	invoice_body?: string; 
};

export interface IProductAssetPayload {
	id?: number;
	product: string | number;
	image?: string | number;
	order?: number;
}

export interface IProductVariantsPayload {
	product_id: string;
	variants: { id: number; is_active: boolean, imported_variant_id: number }[];
}
