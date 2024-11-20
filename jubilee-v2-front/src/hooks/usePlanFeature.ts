import { Limits } from "~/types/billing";
import { useAccount } from "./useAccount";
import { DISABLE_PAYMENTS, isFeatureEnabledOnPlan } from "~/helpers/plans";

export const usePlanFeature = () => {
  const { account } = useAccount();

  const isFeatureEnabled = (limitType: Limits) => {
    if (DISABLE_PAYMENTS) return true;

    if (account?.active_subscription?.paused_at) return false;

    return isFeatureEnabledOnPlan(
      limitType,
      account?.active_subscription?.plan
    );
  };

  const isFeatureDisabled = (value: Limits) => !isFeatureEnabled(value);

  const isFeaturePaused = () => !!account?.active_subscription?.paused_at;

  return { isFeatureEnabled, isFeatureDisabled, isFeaturePaused };
};
