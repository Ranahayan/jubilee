export enum SubscriptionType {
  ANNUAL = "yearly",
  MONTHLY = "monthly",
}

export interface ILimit {
  branded_invoice: false;
  live_products: number;
  premium_products: number;
  customized_product_image_background: false;
}

export enum Limits {
  BRANDED_INVOICE = "branded_invoice",
  LIVE_PRODUCTS = "live_products",
  PREMIUM_PRODUCTS = "premium_products",
  CUSTOMIZED_BACKGROUND = "customized_product_image_background",
  PAID_PLAN = "paid_plan",
}

export enum InvoiceStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  DRAFT = "draft",
  PENDING = "pending",
  SUCCESS = "succeeded",
  FAILED = "failed",
}

export interface SubscriptionHistory {
  period_start: string;
  period_end: string;
}

export interface Invoice {
  id: number;
  invoice_pdf?: string;
  payment_external_id: string;
  payment_method?: string;
  amount: number;
  status: string;
  subscription_history: SubscriptionHistory;
  created_at: string;
  entity_type: "subscription" | "one_time";
}

export interface IPlan {
  id?: string;
  interval?: string;
  status?: string;
  cost_per_month: number;
  old_cost_per_month?: number;
  created_at?: string;
  updated_at?: string;
  features: string[];
  limits?: ILimit;
  trial_days?: number;
  name: string;
  is_highlighted: boolean;
  months_off: number;
  stripe_upgrade_funnel_coupon_code: string | null;
  stripe_upgrade_funnel_coupon: {
    duration_in_months: number;
    percent_off: number;
  } | null;
  store_creation_tax_cents?: number;
  for_winning: boolean;
}

export interface IPaymentValues {
  name?: string;
  payment_method_id?: string;
  setup_intent?: string;
  promo_code_id?: string;
}

export interface IProration {
  old_plan_proration: number;
  new_plan_proration: number;
  total: number;
}
