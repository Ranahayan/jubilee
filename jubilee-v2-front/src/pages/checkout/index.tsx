import FlexContainer from "~/components/ui/FlexContainer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlans } from "~/api/billing/queries";
import { usePayment } from "./usePayment";
import { usePaymentMethod } from "~/hooks/usePaymentMethod";
import { IPlan, SubscriptionType } from "~/types/billing";
import { useAccount } from "~/hooks/useAccount";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import Loader from "~/components/ui/Loader";
import _debounce from "lodash/debounce";
import { useStripeConfirmation } from "./useStripeConfirmation";
import CheckoutContent from "./CheckoutContent";
import handleErrors from "~/helpers/handleErrors";
import { useSetupIntent } from "./useSetupIntent";
import { useShopifyPayment } from "./useShopifyPayment";
import { getCheckoutAction } from "~/helpers/plans";
import {
  triggerGTMAddPaymentInfo,
  triggerGTMDowngrade,
  triggerGTMPlanSubscription,
  triggerGTMStartTrial,
  triggerGTMUpgrade,
} from "~/helpers/gtm";
import { paths } from "~/router/paths";

const stripePromise: Promise<Stripe | null> = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

export interface CheckoutContentBaseProps {
  isLoading?: boolean;
  setIsLoading?: (isLoading: boolean) => void;
  plan?: IPlan;
  clientSecret?: string;
  onPayment?: () => void;
}

const CheckoutStripe = ({
  isLoading,
  clientSecret,
  setIsLoading,
  plan,
  onPayment,
}: CheckoutContentBaseProps) => {
  const { isConfirming, handlePayment } = useStripeConfirmation(
    plan,
    setIsLoading,
    onPayment
  );

  const handlePaymentWrapper = async () => {
    await handlePayment();
  };

  if (isConfirming) return <Loader fullWidth />;

  return (
    <CheckoutContent
      clientSecret={clientSecret}
      isLoading={isLoading}
      onPayment={handlePaymentWrapper}
      plan={plan}
    />
  );
};

const CheckoutStripeWrapper = (props: CheckoutContentBaseProps) => {
  const appearance = {
    theme: "stripe",
  };
  const options = {
    clientSecret: props.clientSecret,
    appearance,
  };

  if (!props.clientSecret) return <Loader fullWidth />;

  return (
    //@ts-ignore
    <Elements options={options} stripe={stripePromise}>
      <CheckoutStripe
        clientSecret={props.clientSecret}
        setIsLoading={props.setIsLoading}
        isLoading={props.isLoading}
        plan={props.plan}
        onPayment={props.onPayment}
      />
    </Elements>
  );
};

const CheckoutShopify = ({
  setIsLoading,
  isLoading,
  plan,
  onPayment,
}: CheckoutContentBaseProps) => {
  const payShopify = useShopifyPayment(plan?.id || "");
  const { t } = useTranslation();

  const handlePayment = async () => {
    if (!setIsLoading || !plan) return;
    setIsLoading(true);
    const messages = {
      success: t("checkout.shopify_redirect"),
      error: t("checkout.error"),
      loading: t("checkout.loading"),
    };
    const { response, errors } = await handleErrors(payShopify, messages);
    setIsLoading(false);
    if (!errors) {
      onPayment?.();
    }

    if (response.confirmation_url)
      window.location.replace(response.confirmation_url);
  };

  return (
    <CheckoutContent
      isLoading={isLoading}
      isShopifyPayment
      onPayment={handlePayment}
      plan={plan}
    />
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(location.state?.selectedPlanId || null);
  const getSetupIntent = useSetupIntent();
  const { data: plans } = usePlans();
  const [clientSecret, setClientSecret] = useState();
  const { account, bootIntercom } = useAccount();
  const getClientSecretDebounced = useCallback(
    _debounce(async (account) => {
      if (!clientSecret) {
        const response = await getSetupIntent(account);
        setClientSecret(response?.client_secret);
      }
    }, 200),
    [clientSecret]
  );

  useEffect(() => {
    const planHistoryKey = "selectedPlanHistory";
    const planHistory = JSON.parse(localStorage.getItem(planHistoryKey) || "[]");
    if (location.state?.selectedPlanId) {
      const currentPlanId = location.state.selectedPlanId;
      const lastPlanId = planHistory[planHistory.length - 1];

      if (currentPlanId !== lastPlanId) {
        planHistory.push(currentPlanId);
        if (planHistory.length > 2) {
          planHistory.shift();
        }
        localStorage.setItem(planHistoryKey, JSON.stringify(planHistory));
      }

      setSelectedPlanId(currentPlanId);
    } else if (!selectedPlanId) {
      if (planHistory.length === 0) {
        navigate(paths.settings.plans);
      } else {
        const lastPlanId = planHistory[planHistory.length - 1];
        setSelectedPlanId(lastPlanId || null);
      }
    }
  }, [location.state?.selectedPlanId, selectedPlanId]);

  useEffect(() => {
    if (!account) {
      return;
    }
    getClientSecretDebounced(account);
    bootIntercom();
  }, [account?.id]);

  const plan = plans?.find((plan) => plan.id == selectedPlanId);
  const { isUserShopify } = usePaymentMethod();
  const [isLoading, setIsLoading] = useState(false);

  if (!plan) return null;

  const handlePayment = () => {
    const checkoutAction = getCheckoutAction(account, plan);

    triggerGTMPlanSubscription(plan);
    switch (checkoutAction) {
      case "trial":
        return triggerGTMStartTrial(plan);
      case "downgrade":
        return triggerGTMDowngrade(plan);
      case "upgrade":
        return triggerGTMUpgrade(plan);
      case "firstSubscription":
        return triggerGTMAddPaymentInfo();
    }
  };

  return (
    <FlexContainer
      height="100vh"
      width="100%"
      flexDirection="column"
      justifyContent="flex-start">
      <FlexContainer
        width="100%"
        height="100%"
        flexDirection="column"
        justifyContent="flex-start">
        {isUserShopify ? (
          <CheckoutShopify
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            plan={plan}
            onPayment={handlePayment}
          />
        ) : (
          //@ts-ignore
          <CheckoutStripeWrapper
            setIsLoading={setIsLoading}
            isLoading={isLoading}
            plan={plan}
            clientSecret={clientSecret}
            onPayment={handlePayment}
          />
        )}
      </FlexContainer>
    </FlexContainer>
  );
};

export default Checkout;
