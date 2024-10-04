export enum Brand {
  UNBRANDED = "unbranded",
  BRANDED = "branded",
  BRAND_NAME = "brand_name",
  BRAND_LOGO = "brand_logo",
}

export enum OrderType {
  SAMPLE_ORDER = "sample_order",
  SHOPIFY = "shopify",
}

export enum ProductType {
  WHOLESALE = "wholesale",
  DROPSHIP_BRANDED = "dropship_branded",
  DROPSHIP_UNBRANDED = "dropship_unbranded",
}

export enum Status {
  PAID = "paid",
  UNPAID = "unpaid",
  REFUNDED = "refunded",
}

export interface ICategories {
  id: number;
  name: string;
  is_visible: boolean;
  is_active: boolean;
  image: string;
  parent: number | null;
}

export interface IShipping {
  base_price_cents: number;
  incremental_price_cents: number;
  delivery_time: string;
  processing_time?: string;
}

export interface IProduct {
  id: string;
  title: string;
  description: string;
  sku: string;
  tags: string[];
  is_imported: boolean;
  is_live: boolean;
  shopify_product_link: string;
  assets: IProductAssets[];
  variants: IProductVariant[];
  options: IProductOptions[];
  branding_type: Brand;
  moq_quantity: number;
  is_premium: boolean;
  is_active: boolean;
  supplier: string;
  category: number;
  category_name: string;
  country: string;
  shipping_domestic: IShipping;
  shipping_international: IShipping;
  background_color?: string;
  shipping_fallback?: IShipping;
  shipping_options: IShippingOption[];
  collections?: string[];
}

export interface IShippingOption {
  country: string;
  shipping: IShipping;
}

export interface IProductAssets {
  id: number;
  image: string;
  thumbnail?: string;
  product: number;
  order: number;
}

export interface IProductParams {
  page?: number;
  is_premium?: boolean;
  is_moq?: boolean;
  branding_type?: Brand | null;
  category?: number;
  tags?: string[];
  search_term?: string;
  search_image_id?: number;
  sort_by_price?: "asc" | "desc";
  sort_by_created_at?: "asc" | "desc";
  sort_by_number_of_orders?: "asc" | "desc";
}

export type IProductVariant = {
  id: number;
  title: string;
  weight: number;
  sku: string;
  inventory_quantity: number;
  price_cents: number;
  retail_price_cents: number;
  product_type: string;
  selected_options: ISelectedOptions[];
  product: number;
  image: string;
};

export interface ISelectedOptions {
  name: string;
  value: string;
}

export interface IProductList {
  data: IProduct[];
  page: number;
  total_pages: number;
}

export interface IProductOptions {
  id: string;
  name: string;
  values: string[];
}

export interface IPushToStoreParams {
  product_id: string;
  is_live: boolean;
  title: string;
  description: string;
  collections?: string[];
  tags?: string[];
}

export interface ImportProduct {
  id: number;
  description: string | null;
  is_live: boolean;
  live_at: string | null;
  shopify_product_id: string | null;
  shop: number;
  product: number;
}

export interface ImportList {
  data: ImportProduct[];
  page: number;
  total_pages: number;
}

export interface LineItem {
  id: number;
  title: string;
  quantity: number;
  sku: string;
  cost_cents: number;
  moq_quantity: number;
  total_cost_cents: number;
  total_shipping_cost_cents: number;
  shopify_fulfillment_id: string | null;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  sub_order: number;
  product: number;
  variant: number;
}

export interface ISupplier {
  name: string;
}

export interface SubOrder {
  id: number;
  line_items: LineItem[];
  total_cost_cents: number;
  shipping_cost_cents: number;
  status: Status;
  status_display: string;
  transaction_fee: number;
  is_international: boolean;
  checkout_at: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  tracking_link: string | null;
  shop: number;
  order: number;
  supplier: ISupplier | string | null;
}

export interface IShippingAddress {
  id: string;
  title: string;
  city: string;
  country: string;
  line_1: string;
  line_2: string;
  phone: string;
  state: string;
  zip: string;
}

interface ICustomer {
  first_name: string;
  id: string;
  last_name: string;
}

export interface Order {
  id: number;
  sub_orders: SubOrder[];
  shopify_order_id: string | null;
  shopify_order_name: string | null;
  order_type: OrderType;
  is_active: boolean;
  shop: number;
  customer: ICustomer;
  shipping_address: IShippingAddress | null;
  created_at: string;
}

export interface TrackingData {
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}
