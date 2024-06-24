import { ICategories } from "./dropshipping";
import { IPlan } from "./billing";

export enum PlanStatus {
  ACTIVE = "AC",
  PAUSED = "PA",
  INACTIVE = "IN",
  PAST_DUE = "PD",
}

export interface IActiveSubscription {
  id: string;
  payment_provider: string;
  plan: IPlan;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
  paused_at: string;
  cancelled_at: string;
  cancel_at: string;
  trial_end_at: string;
}

export interface IAccount {
  created_at: string;
  id: number;
  email: string;
  name: string;
  signup_origin: string;
  payment_provider: string;
  stripe_card_digits: string;
  has_password: boolean;
  active_subscription: IActiveSubscription;
  categories: ICategories[];
  has_subscribed_before: boolean;
  is_annual_shopify: boolean;
  last_subscription?: IActiveSubscription;
  pause_count: number;
  onboarding_choices?: IOnboardingChoices;
  has_created_stripe_upgrade_funnel_coupon: boolean;
  has_used_stripe_upgrade_funnel_coupon: boolean;
  stripe_card_updated_at?: string;
}

export interface IOnboardingChoices {
  selectedCategories?: (string | number | null)[];
  brand_name?: string;
  brand_logo?: string;
}
