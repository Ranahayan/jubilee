import { IAccount } from "~/types/account";
import { ILimit, IPlan, Limits, SubscriptionType } from "~/types/billing";
import { getTotalPlanCost } from "./numbers";

export const DISABLE_PAYMENTS = false;
export const DISABLE_TRIAL_FEES = true;

export const getCheckoutAction = (
  account: IAccount | null,
  plan: IPlan | undefined
): "trial" | "downgrade" | "upgrade" | "firstSubscription" => {
  const isDowngrade =
    account?.active_subscription?.plan &&
    getTotalPlanCost(plan) < getTotalPlanCost(account.active_subscription.plan);

  if (!account?.has_subscribed_before) {
    if (!!plan?.trial_days) {
      return "trial";
    }

    return "firstSubscription";
  }

  if (isDowngrade) {
    return "downgrade";
  }

  return "upgrade";
};

export const isFeatureEnabledOnPlan = (
  limitType: Limits,
  plan: IPlan | undefined
) => {
  if (DISABLE_PAYMENTS) return true;

  const limits: ILimit | Record<any, any> = plan?.limits || {};

  if (limitType === Limits.PAID_PLAN) {
    return !!plan;
  }

  if (!limits) return false;

  return !!limits[limitType];
};
