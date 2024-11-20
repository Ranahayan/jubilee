import { LeavingOptions } from "~/constants/cancel";

export const PLANS = ["PLANS"];
export const INVOICES = ["INVOICES"];
export const PRORATION = ["PRORATION"];

export interface ISubscriptionShopify {
  plan_id?: string;
}

export interface ISubscriptionPaypal {
  plan_id: string;
}

export interface ISubscriptionStripe {
  plan_id?: string;
  name?: string;
  payment_method_id?: string;
  setup_intent?: string;
  promo_code_id?: string;
  utms?: {
    [key: string]: string | null;
  } | null;
}

export interface ICancelSubscription {
  password: string;
  confirm_password: string;
}

export interface ICancellationInfo {
  reason?: LeavingOptions;
  returning: number;
  note?: string;
}

export type StripePromoCode = {
  promo_code_id: string;
  duration_in_months: number;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
};
