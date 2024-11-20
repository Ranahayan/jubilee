import { usePlans } from "~/api/billing/queries";
import { useMemo } from "react";
import { Limits, SubscriptionType } from "~/types/billing";
import { isFeatureEnabledOnPlan } from "~/helpers/plans";

export const useMinimumPlanForLimit = (limitType: Limits) => {
  const { data: plans } = usePlans();

  if (!plans) {
    return { minimumPlan: undefined, hasAbovePlans: false };
  }

  const activePlans = plans
    .filter((plan) => plan.status === "AC")
    .sort((a, b) => a.cost_per_month - b.cost_per_month);

  const minimumPlan = useMemo(() => {
    if (activePlans.length === 0) {
      return undefined;
    }

    const minimumAnnualPlan = activePlans.find(
      (plan) =>
        plan.interval === SubscriptionType.ANNUAL &&
        isFeatureEnabledOnPlan(limitType, plan)
    );

    const minimumMonthlyPlan = activePlans.find(
      (plan) =>
        plan.interval === SubscriptionType.MONTHLY &&
        isFeatureEnabledOnPlan(limitType, plan)
    );

    if (!minimumAnnualPlan) {
      return minimumMonthlyPlan;
    }

    if (!minimumMonthlyPlan) {
      return minimumAnnualPlan;
    }

    // Prefer annual plan if monthly and annual plans are the same
    if (minimumMonthlyPlan.name === minimumAnnualPlan.name) {
      return minimumAnnualPlan;
    }

    return minimumMonthlyPlan;
  }, [activePlans]);

  const hasAbovePlans = minimumPlan
    ? activePlans.some(
        (plan) =>
          plan.interval === minimumPlan.interval &&
          plan.cost_per_month > minimumPlan.cost_per_month
      )
    : false;

  return { minimumPlan, hasAbovePlans };
};
