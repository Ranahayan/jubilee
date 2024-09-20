import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { InputWrapper, Error } from "~/components/ui/Input/styles";
import * as S from "../CardInput/styles";

const stripePromise: Promise<Stripe | null> = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

interface CardInputProps {
  onTokenChange?: (paymentMethodId: string | null) => void;
  error?: string;
}

const CardInput: React.FC<CardInputProps> = ({ onTokenChange, error }) => {
  const stripe = useStripe();
  const elements = useElements();

  const options = {
    style: {
      base: {
        fontSize: "14px",
        color: "#04004d",
        "::placeholder": {
          color: "#04004d80",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  const handleChange = async (event: any) => {
    if (!stripe || !elements || !onTokenChange) {
      return;
    }

    if (event.error) {
      console.error("[error]", event.error);
      onTokenChange(null);
    } else if (event.complete) {
      const cardElement = elements.getElement(CardElement);
      ``;
      if (cardElement) {
        const { error, token } = await stripe.createToken(cardElement);

        if (error) {
          console.error("[error]", error);
          onTokenChange(null);
        } else {
          onTokenChange(token?.id ?? null);
        }
      }
    } else {
      onTokenChange(null);
    }
  };

  return (
    <InputWrapper className={error ? "error" : ""}>
      <S.CardElementWrapper>
        <CardElement options={options} onChange={handleChange} />
      </S.CardElementWrapper>

      {error && <Error>{error}</Error>}
    </InputWrapper>
  );
};

const CardInputSmartliWrapper: React.FC<CardInputProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CardInput {...props} />
    </Elements>
  );
};

export default CardInputSmartliWrapper;
