import { PaymentElement } from "@stripe/react-stripe-js";
import { useAccount } from "~/hooks/useAccount";

type Props = {
  clientSecret: string;
};

const PaymentElements = ({ clientSecret }: Props) => {
  const { account } = useAccount();

  const paymentElementOptions = {
    layout: "tabs",
    defaultValues: {
      billingDetails: {
        name: account?.name,
        email: account?.email,
      },
    },
  };

  return clientSecret ? (
    <PaymentElement
      id="payment-element"
      // @ts-ignore
      options={paymentElementOptions}
    />
  ) : null;
};

export default PaymentElements;
