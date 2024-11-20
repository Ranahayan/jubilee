import { useMutation, useQuery } from "@tanstack/react-query";
import { Invoice, IPlan, IProration } from "~/types/billing";
import { INVOICES, PLANS, PRORATION } from "./types";
import {
  shopifySubscription,
  getPlans,
  stripeSubscription,
  updateCard,
  cancelSubscription,
  getInvoices,
  getProration,
  stripeIntent,
  cancellationInfo,
  paypalSubscription,
} from "./requests";

export const usePlans = () =>
  useQuery<Array<IPlan>>(PLANS, () => getPlans, {
    refetchInterval: 1000,
    cacheTime: 0,
  });

export const useInvoices = () =>
  useQuery<Array<Invoice>>(INVOICES, () => getInvoices());

export const useShopifySubscription = () => useMutation(shopifySubscription);

export const usePaypalSubscription = () => useMutation(paypalSubscription);

export const useStripeSubscription = () => useMutation(stripeSubscription);

export const useStripeIntent = () => useMutation(stripeIntent);

export const useUpdateCard = () => useMutation(updateCard);

export const useCancelSubscription = () => useMutation(cancelSubscription);

export const useProrationValue = (planId?: string, promoCodeId?: string) =>
  useQuery<IProration>([PRORATION, planId], () =>
    getProration(planId, promoCodeId)
  );

export const useCancellationInfo = () => useMutation(cancellationInfo);
