import { MonthlyPlan } from "./Monthly";
import { AnnualPlan } from "./Annual";
import { usePlans } from "~/api/billing/queries";
import { centsToDecimal } from "~/helpers/numbers";
import { SubscriptionType } from "~/types/billing";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import { useMemo } from "react";
import { useAccount } from "~/hooks/useAccount";
import { PlanWithStripeCoupon } from "./PlanWithStripeCoupon";
import { usePaymentMethod } from "~/hooks/usePaymentMethod";

type Props = {
  planId: string;
  close: () => void;
};

export const UpgradeFunnel = ({ planId, close }: Props) => {
  const { data: plans } = usePlans();
  const { account, getAccount } = useAccount();
  const { isUserStripe } = usePaymentMethod();
  const navigate = useNavigate();

  const activePlans = useMemo(
    () => plans?.filter((p) => p.status === "AC"),
    [plans]
  );

  const targetDate = useMemo(() => {
    const updatedAt = account?.active_subscription?.updated_at;
    const createdAt = account?.active_subscription?.created_at;
    const updatedSubscription = updatedAt ? updatedAt : createdAt;
    const subscriptionDate = updatedSubscription
      ? new Date(updatedSubscription)
      : new Date();
    return new Date(subscriptionDate.getTime() + 5 * 60000);
  }, [account]);

  const {
    currentPlan,
    upgradedPlan,
    nextPlanWithStripeCoupon,
    isAnnual,
    annualMonthlyValue,
    currentPlanMonthlyPrice,
  } = useMemo(() => {
    const currentPlan = plans?.find((plan) => plan.id == planId);
    const isStarterPlan = currentPlan?.name === "Starter";
    const proPlan = activePlans?.find(
      (plan) => plan.name == "Pro" && plan.interval === SubscriptionType.ANNUAL
    );

    const nextPlanWithStripeCoupon =
      isUserStripe && currentPlan
        ? activePlans?.find(
          (plan) =>
            plan.stripe_upgrade_funnel_coupon !== null &&
            plan.cost_per_month > currentPlan.cost_per_month &&
            plan.interval === currentPlan.interval
        )
        : undefined;

    const upgradedPlan = isStarterPlan
      ? proPlan
      : activePlans?.find((plan) => plan.name == currentPlan?.name);
    const annualMonthlyValue = upgradedPlan?.cost_per_month
      ? centsToDecimal(upgradedPlan?.cost_per_month)
      : 0;
    const currentPlanMonthlyPrice = isStarterPlan
      ? proPlan?.old_cost_per_month
      : currentPlan?.cost_per_month;
    const isAnnual = currentPlan?.interval === SubscriptionType.ANNUAL;
    return {
      currentPlan,
      upgradedPlan,
      nextPlanWithStripeCoupon,
      isAnnual,
      annualMonthlyValue,
      currentPlanMonthlyPrice,
    };
  }, [planId, activePlans, isUserStripe]);

  const approveAndRedirectToPayment = async () => {
    localStorage.setItem("monthlyPlan", "true");
    navigate({
      pathname: paths.checkout.index,
    }, { state: { selectedPlanId: upgradedPlan?.id || "" } })

  };

  if (!activePlans) {
    return null;
  }

  if (account?.has_used_stripe_upgrade_funnel_coupon) {
    return null;
  }

  if (isAnnual) {
    return (
      <AnnualPlan
        features={currentPlan?.features ?? []}
        close={() => {
          close();
          getAccount();
        }}
      />
    );
  }

  return (
    <MonthlyPlan
      targetDate={targetDate}
      monthsFree={upgradedPlan?.months_off || 0}
      monthlyPrice={annualMonthlyValue}
      monthlyOldPrice={centsToDecimal(currentPlanMonthlyPrice || 0)}
      planName={upgradedPlan?.name || ""}
      close={() => {
        close();
        getAccount();
      }}
      callback={approveAndRedirectToPayment}
    />
  );
};
