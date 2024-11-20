import { sendPost, sendPut } from "../base";
import { sendGet } from "../base";
import { getAPIData } from "../helpers";
import {
  ICancellationInfo,
  ICancelSubscription,
  ISubscriptionPaypal,
  ISubscriptionShopify,
  ISubscriptionStripe,
  StripePromoCode,
} from "./types";

export const getPlans = getAPIData(sendGet("billing/subscriptions/plans/"));

export const shopifySubscription = (params: ISubscriptionShopify) =>
  getAPIData(sendPost("billing/subscriptions/shopify/subscribe/", params));

export const paypalSubscription = (params: ISubscriptionPaypal) =>
  getAPIData<{ payment_url: string }>(
    sendPost("billing/subscriptions/paypal/subscribe/", params)
  );

export const paypalConfirmSubscription = (
  paypalSubscriptionId: number,
  executeToken: string
) =>
  getAPIData<{ plan_id: string }>(
    sendPost(`billing/subscriptions/paypal/confirm/${paypalSubscriptionId}/`, {
      execute_token: executeToken,
    })
  );

export const stripeSubscription = (params: ISubscriptionStripe) =>
  getAPIData(sendPost("billing/subscriptions/stripe/subscribe/", params));

export const updateCard = (params: ISubscriptionStripe) =>
  getAPIData(sendPut("billing/subscriptions/stripe/update/", params));

export const cancelSubscription = (params: ICancelSubscription) =>
  getAPIData(sendPost("billing/subscriptions/cancel/", params));

export const pauseSubscription = () =>
  getAPIData(sendPut("billing/subscriptions/pause/"));

export const resumeSubscription = () =>
  getAPIData(sendPut("billing/subscriptions/resume/"));

export const getInvoices = () =>
  getAPIData(sendGet("billing/subscriptions/invoices/"));

export const getProration = (planId?: string, promoCodeId?: string) =>
  getAPIData(
    sendGet(`billing/subscriptions/stripe/proration/${planId}`, {
      promo_code_id: promoCodeId,
    })
  );

export const stripeIntent = () =>
  getAPIData(sendPost("billing/subscriptions/stripe/intent/"));

export const cancellationInfo = (data: ICancellationInfo) =>
  getAPIData(sendPost("billing/subscriptions/cancellation/", data));

export const getPromoCode = (promoCode: string, planId: string) =>
  getAPIData<StripePromoCode>(
    sendGet(`billing/subscriptions/stripe/promo-code/${promoCode}/`, {
      plan_id: planId,
    })
  );
