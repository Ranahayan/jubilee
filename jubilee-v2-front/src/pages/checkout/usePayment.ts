import { useStripe } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import { useStripeSubscription } from "~/api/billing/queries";
import { ISubscriptionStripe } from "~/api/billing/types";
import handleErrors from "~/helpers/handleErrors";
import { IPaymentValues } from "~/types/billing";
import { useShopifyPayment } from "./useShopifyPayment";
import { toast } from "~/components/toast";
import { useUTM } from "~/hooks/useUTM";
import { UAParser } from 'ua-parser-js';

type Props = {
  planId: string;
  isUserShopify: boolean;
};

export const usePayment = ({ planId, isUserShopify }: Props) => {
  const { mutateAsync: stripeSubscription } = useStripeSubscription();
  const { t } = useTranslation();
  const stripe = useStripe();
  const payShopify = useShopifyPayment(planId);
  const utms = useUTM();
  const parser = new UAParser();

  const payStripe = async (values?: IPaymentValues) => {
    const payload: ISubscriptionStripe = { plan_id: planId };
    if (values?.name) payload.name = values?.name;
    if (values?.payment_method_id)
      payload.payment_method_id = values?.payment_method_id;
    if (values?.setup_intent) payload.setup_intent = values?.setup_intent;
    if (values?.promo_code_id) payload.promo_code_id = values?.promo_code_id;
    try {
      let filledUTMs = Object.entries(utms).filter(([key, value]) => value !== null)
      let utmParams: any = null;
      if(filledUTMs.length > 0) {
        utmParams = Object.fromEntries(filledUTMs)
      }
      
      const osValue = parser.getOS().name + ' ' + (parser.getOS().version || '');
      const deviceValue = parser.getDevice().model || 'desktop';
      const browserValue = parser.getBrowser().name + ' ' + (parser.getBrowser().version || '');
      
      const response = await stripeSubscription({
        ...payload,
        utms: utmParams ? {
          ...utmParams,
          device: deviceValue,
          os: osValue,
          browser: browserValue,
        } : {
          device: deviceValue,
          os: osValue,
          browser: browserValue,
        },
      });
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("plan_id", planId);
      searchParams.delete("annual");
      searchParams.delete("annual-plans-modal");
      let returnURL = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`;

      if (response?.client_secret && stripe) {
        const confirmCardPaymentResponse = await stripe.confirmCardPayment(
          response.client_secret,
          {
            return_url: returnURL,
            payment_method: response.payment_method_id,
          },
          { handleActions: false }
        );

        if (confirmCardPaymentResponse.error) {
          toast.warning(
            confirmCardPaymentResponse.error.message ?? t("checkout.went_wrong")
          );
          return confirmCardPaymentResponse?.error;
        }

        if (
          confirmCardPaymentResponse.paymentIntent.next_action?.redirect_to_url
            ?.url
        ) {
          window.location.replace(
            confirmCardPaymentResponse.paymentIntent.next_action.redirect_to_url
              .url
          );
          return "3ds_required";
        }

        if (confirmCardPaymentResponse.paymentIntent.status !== "succeeded") {
          return "error";
        }
        return null;
      }
    } catch {
      toast.warning(t("checkout.went_wrong"));
      return "error";
    }

    return null;
  };

  const pay = async (values?: IPaymentValues) => {
    if (isUserShopify) {
      return payShopify();
    }

    const toastMessages = {
      loading: t("checkout.loading"),
      success: t("checkout.success"),
      error: t("checkout.error"),
    };
    const { response } = await handleErrors(
      () => payStripe(values),
      toastMessages
    );
    return response;
  };

  return { pay, payStripe, payShopify };
};
