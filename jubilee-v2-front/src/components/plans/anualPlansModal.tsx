import * as S from "./plansModal.style";
import { SVG } from "~/components/ui/SVG";
import _debounce from "lodash/debounce";
import { faClose } from "@fortawesome/pro-light-svg-icons";
import { useCallback, useEffect, useState } from "react";
import { Plans } from "~/components/plans";
import ReactDOM from "react-dom";
import { getCheckoutAction } from "~/helpers/plans";
import { triggerGTMAddPaymentInfo, triggerGTMDowngrade, triggerGTMPlanSubscription, triggerGTMStartTrial, triggerGTMUpgrade } from "~/helpers/gtm";
import { useAccount } from "~/hooks/useAccount";
import { useSetupIntent } from "~/pages/checkout/useSetupIntent";
import { IPlan } from "~/types/billing";
import { useStripeConfirmation } from "~/pages/checkout/useStripeConfirmation";
import { Elements } from "@stripe/react-stripe-js";
import Loader from "../ui/Loader";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Modal from "../ui/Modal";
import { IAccount } from "~/types/account";

const stripePromise: Promise<Stripe | null> = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

interface showPlansModalProps {
  show: boolean;
  initialIsAnnual?: boolean
}

export interface CheckoutContentBaseProps {
  handlePaymentClick?: (plan: IPlan) => void
  clientSecret?: string
  selectedPlan?: IPlan
  setIsLoading?: (isLoading: boolean) => void
  isLoading?: boolean
  onPayment?: () => void
  setShowPlansModal: (setShowPlansModal: showPlansModalProps) => void
  showPlansModal: showPlansModalProps
}
const StyledDiv = styled.div<{ isLoading: boolean }>`
    opacity: ${({ isLoading }) => (isLoading ? 0.5 : 1)};
  `;

const CheckoutPlansWrapper = (props: CheckoutContentBaseProps) => {
  const navigate = useNavigate();
  const { handlePayment } = useStripeConfirmation(
    props.selectedPlan,
    props.setIsLoading,
    props.onPayment
  );

  const callHandlePayment = async () => {
    const checkoutActionError = await handlePayment(true)
    if (checkoutActionError?.error) {
      props.setShowPlansModal({ show: false });
      navigate("/checkout", { state: { selectedPlanId: props.selectedPlan?.id } })
    } else {
      props.setShowPlansModal({ show: false });
    }
  }


  useEffect(() => {
    if (props.selectedPlan) callHandlePayment()

  }, [props.selectedPlan]);


  return (
    <>
      {props.isLoading && <Loader fullWidth />}
      <StyledDiv isLoading={props.isLoading ?? false}>
        <Plans
          closeModal={() => props.setShowPlansModal({ show: false })}
          initialIsAnnual={true}
          handleClickCheckout={props.handlePaymentClick}
        />
      </StyledDiv>
    </>
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

  return (
    //@ts-ignore
    <Elements options={options} stripe={stripePromise}>
      <CheckoutPlansWrapper
        clientSecret={props.clientSecret}
        setIsLoading={props.setIsLoading}
        isLoading={props.isLoading}
        selectedPlan={props.selectedPlan}
        onPayment={props.onPayment}
        handlePaymentClick={props.handlePaymentClick}
        setShowPlansModal={props.setShowPlansModal}
        showPlansModal={props.showPlansModal} />
    </Elements>
  );
};

export const AnualPlansModal = () => {
  const { account, bootIntercom } = useAccount();
  const getSetupIntent = useSetupIntent();
  const [clientSecret, setClientSecret] = useState();
  const [selectedPlan, setSelectedPlan] = useState<IPlan | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const queryParams = new URLSearchParams(location.search);
  const annual = queryParams.get("annual");

  const [showPlansModal, setShowPlansModal] = useState<showPlansModalProps>({
    show: false,
  });

  const getClientSecret = async (account: IAccount) => {
    if (!clientSecret) {
      const response = await getSetupIntent(account);
      setClientSecret(response?.client_secret);
    }
  }

  const onPayment = () => {
    const checkoutAction = getCheckoutAction(account, selectedPlan);
    if (!selectedPlan) return;

    triggerGTMPlanSubscription(selectedPlan);
    switch (checkoutAction) {
      case "trial":
        return triggerGTMStartTrial(selectedPlan);
      case "downgrade":
        return triggerGTMDowngrade(selectedPlan);
      case "upgrade":
        return triggerGTMUpgrade(selectedPlan);
      case "firstSubscription":
        return triggerGTMAddPaymentInfo();
    }
  };

  const handlePaymentClick = (plan: IPlan) => {
    setSelectedPlan(plan);
  };

  const closeModal = () => {
    setShowPlansModal({ show: false });
  };

  useEffect(() => {
    if (showPlansModal?.show) return
    if (annual === "true") {
      setShowPlansModal({
        show: true,
        initialIsAnnual: true
      })
    }
  }, [annual]);



  useEffect(() => {
    if (showPlansModal?.show) return

    if (annual === "true") {
      setShowPlansModal({
        show: true,
        initialIsAnnual: true
      })
    }
  }, [annual, clientSecret]);

  useEffect(() => {
    if (!account || showPlansModal.show === false || clientSecret) {
      return;
    }
    getClientSecret(account);
  }, [account, showPlansModal.show]);

  if (!clientSecret) return (<Modal
    id="annual-plans-modal"
    hide={closeModal}
    isShowing={showPlansModal.show}
    minWidth="80%"
  >
    <Loader fullWidth />
  </Modal>)

  return <Modal
    id="annual-plans-modal"
    hide={closeModal}
    isShowing={showPlansModal.show}
    minWidth="80%"
  >
    <CheckoutStripeWrapper
      clientSecret={clientSecret}
      handlePaymentClick={handlePaymentClick}
      onPayment={onPayment}
      setIsLoading={setIsLoading}
      isLoading={isLoading}
      selectedPlan={selectedPlan}
      setShowPlansModal={setShowPlansModal}
      showPlansModal={showPlansModal} />
  </Modal>
};
