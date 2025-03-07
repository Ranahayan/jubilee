import { getTotalPlanCost } from "~/helpers/numbers";
import { IPlan } from "~/types/billing";
import { IProduct } from "~/types/dropshipping";

const triggerGTMEvent = (eventData: {
  event: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  value?: string;
}) => {
  if (!import.meta.env.VITE_GOOGLE_TAG_KEY) {
    const { event, ...rest } = eventData;
    console.log(`[GTM Event - ${event}]`, rest);
    return;
  }

  // @ts-ignore
  if (window.dataLayer) {
    // @ts-ignore
    window.dataLayer.push(eventData);
  }
};

export const triggerGTMPlanSubscription = (plan: IPlan) =>
  triggerGTMEvent({
    event: `subscription_${plan.name.split(" ")[0]}_${plan?.interval}`,
    event_category: `subscription_${plan.name.split(" ")[0]}`,
    event_action: `subscription_${plan.interval}`,
    event_label: `subscription_${plan.name.split(" ")[0]}`,
    value: `${plan.name} - ${plan?.interval} - ${getTotalPlanCost(plan)}`,
  });

export const triggerGTMAddToImportList = (product: IProduct) =>
  triggerGTMEvent({
    event: "Added to Import List",
    value: `(${product.id}) ${product.title}`,
  });

export const triggerGTMAddPaymentInfo = () =>
  triggerGTMEvent({ event: "AddPaymentInfo" });

export const triggerGTMBulkCheckout = (subOrderIds: number[]) =>
  triggerGTMEvent({
    event: "Bulk Checkout (dropshipping)",
    value: subOrderIds.map((id) => id.toString()).join(", "),
  });

export const triggerGTMUpgrade = (plan: IPlan) =>
  triggerGTMEvent({
    event: `buttonUpgrade${plan.name.split(" ")[0]}`,
    event_category: `upgrade_subscription_${plan.name.split(" ")[0]}`,
    event_action: `upgrade_subscription_${plan.interval}`,
    event_label: `upgrade_subscription_${plan.name.split(" ")[0]}`,
    value: `${plan.name} - ${plan?.interval} - ${getTotalPlanCost(plan)}`,
  });

export const triggerGTMDirectSignup = () =>
  triggerGTMEvent({
    event: "Sign Up (Direct)",
  });

export const triggerGTMSignup = () =>
  triggerGTMEvent({
    event: "Sign Up (Landing Page)",
  });

export const triggerGTMDowngrade = (plan: IPlan) =>
  triggerGTMEvent({
    event: "Downgrade",
    event_category: `downgrade_subscription_${plan.name.split(" ")[0]}`,
    event_action: `downgrade_subscription_${plan.interval}`,
    event_label: `downgrade_subscription_${plan.name.split(" ")[0]}`,
    value: `${plan.name} - ${plan?.interval} - ${getTotalPlanCost(plan)}`,
  });

export const triggerGTMPausePlan = (plan: IPlan) =>
  triggerGTMEvent({
    event: "Pause Plan",
    event_category: `pause_subscription_${plan.name.split(" ")[0]}`,
    event_action: `pause_subscription_${plan.interval}`,
    event_label: `pause_subscription_${plan.name.split(" ")[0]}`,
    value: `${plan.name} - ${plan?.interval} - ${getTotalPlanCost(plan)}`,
  });

export const triggerGTMStartTrial = (plan: IPlan) =>
  triggerGTMEvent({
    event: "Start Trial",
    event_category: `start_trial_subscription_${plan.name.split(" ")[0]}`,
    event_action: `start_trial_subscription_${plan.interval}`,
    event_label: `start_trial_subscription_${plan.name.split(" ")[0]}`,
    value: `${plan.name} - ${plan?.interval} - ${getTotalPlanCost(plan)}`,
  });
