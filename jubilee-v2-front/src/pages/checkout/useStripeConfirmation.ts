import { useElements, useStripe } from "@stripe/react-stripe-js";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "~/hooks/useAccount";
import { IPlan } from "~/types/billing";
import { usePayment } from "./usePayment";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetupIntent } from "@stripe/stripe-js";
import { toast } from "~/components/toast";
import { INVOICES, PLANS } from "~/api/billing/types";
import { STORE } from "~/api/store/types";
import { paths } from "~/router/paths";
import _debounce from "lodash/debounce";
import { useTranslation } from "react-i18next";

export const useStripeConfirmation = (
  plan: IPlan | undefined,
  setIsLoading?: (val: boolean) => void,
  onSuccess?: () => void,
  disable_redirect_on_finish?: boolean
) => {
  const [searchParams] = useSearchParams();

  const [isConfirming, setIsConfirming] = useState(
    searchParams.has("setup_intent_client_secret") &&
      searchParams.has("setup_intent_client_secret") &&
      searchParams.get("redirect_status") === "succeeded"
  );

  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const { refetch } = useAccount();
  const { getAccount } = useAccount();
  const { payStripe } = usePayment({
    planId: plan?.id as string,
    isUserShopify: false,
  });
  const client = useQueryClient();
  const navigate = useNavigate();

  const handleSuccess = (plan: IPlan) => {
    client.invalidateQueries(PLANS);
    client.invalidateQueries(STORE);
    client.invalidateQueries(INVOICES);
    getAccount();
    onSuccess?.();
    if(disable_redirect_on_finish) return
    navigate(`${paths.app.home}?plan_id=${plan?.id}`);
  };

  const commitPayment = async (
    setupIntent: SetupIntent | null = null,
    promoCodeId?: string,
    returnError: boolean = false
  ) => {
    if (!plan) return;

    const error = await payStripe(
      setupIntent
        ? { setup_intent: setupIntent.id, promo_code_id: promoCodeId }
        : { promo_code_id: promoCodeId }
    );

    if (error) {
      if (
        error != "error" &&
        error != "3ds_required" &&
        error.type === "invalid_request_error" &&
        error.code === "payment_intent_incompatible_payment_method"
      ) {
        refetch();
      }
      if(returnError) return {error: true}
    } else {
      handleSuccess(plan);
    }
  };

  const debouncedSetupIntentCheck = useCallback(
    _debounce((setupIntentClientSecret: string, promoCodeId: string | null) => {
      if (!stripe || !plan) return;
      stripe
        .retrieveSetupIntent(setupIntentClientSecret)
        .then(async ({ setupIntent, error }) => {
          if (!setupIntent) {
            toast.warning(error.message ?? t("checkout.went_wrong"));
            return;
          }
          switch (setupIntent.status) {
            case "succeeded":
              if (setIsConfirming) setIsConfirming(true);
              await commitPayment(setupIntent, promoCodeId ?? undefined);
              if (setIsConfirming) setIsConfirming(false);
              break;
            case "processing":
              toast.warning(t("checkout.processing_payment"));
              break;
            case "requires_payment_method":
              toast.error(t("checkout.unsuccessful_payment"));
              navigate(window.location.pathname);
              break;
            default:
              toast.warning(t("checkout.went_wrong"));
              navigate(window.location.pathname);
              break;
          }
        });
    }, 500),
    [stripe, plan]
  );

  const debouncedPaymentIntentCheck = useCallback(
    _debounce((setupIntentClientSecret: string) => {
      if (!stripe || !plan) return;
      stripe
        .retrievePaymentIntent(setupIntentClientSecret)
        .then(async ({ paymentIntent, error }) => {
          if (!paymentIntent) {
            toast.warning(error.message ?? t("checkout.went_wrong"));
            setIsConfirming(false);
            return;
          }
          switch (paymentIntent.status) {
            case "succeeded":
              handleSuccess(plan);
              break;
            case "processing":
              toast.warning(t("checkout.processing_payment"));
              break;
            case "requires_payment_method":
              toast.error(t("checkout.unsuccessful_payment"));
              navigate(window.location.pathname);
              break;
            default:
              toast.warning(t("checkout.went_wrong"));
              navigate(window.location.pathname);
              break;
          }
          setIsConfirming(false);
        });
    }, 500),
    [stripe, plan]
  );

  useEffect(() => {
    const setupIntentClientSecret = searchParams.get(
      "setup_intent_client_secret"
    );
    const paymentIntentClientSecret = searchParams.get(
      "payment_intent_client_secret"
    );
    const promoCodeId = searchParams.get("promo_code_id");
    if (!stripe || !plan) return;
    if (setupIntentClientSecret && !paymentIntentClientSecret)
      debouncedSetupIntentCheck(setupIntentClientSecret, promoCodeId);
    if (paymentIntentClientSecret)
      debouncedPaymentIntentCheck(paymentIntentClientSecret);
  }, [stripe, plan]);

  const handlePayment = async (returnError = false) => {
    if (!stripe || !elements || !setIsLoading) {
      return;
    }

    setIsLoading(true);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("plan_id", plan?.id as string);
    let returnURL = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`;
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: returnURL,
        },
      });
      toast.error(error.message ?? t("checkout.went_wrong"));
    } catch {
      const promoCodeId = searchParams.get("promo_code_id");
      const paymentError = await commitPayment(null, promoCodeId ?? undefined, returnError);
      if(returnError && paymentError?.error) return {error: true}
    }

    setIsLoading(false);
  };

  return { handlePayment, isConfirming };
};
