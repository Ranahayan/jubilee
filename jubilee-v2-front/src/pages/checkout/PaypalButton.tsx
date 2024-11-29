import Button from "~/components/ui/Button";
import PayPalLogo from "~/assets/svg/paypal.svg";
import { Loader } from "./styles";
import LoaderSVG from "~/assets/svg/loader.svg?react";
import { usePaypalPayment } from "./usePaypalPayment";

interface Props {
  planId: string;
}

export const PaypalButton = ({ planId }: Props) => {
  const { pay, isLoading } = usePaypalPayment(planId);

  return (
    <Button
      width="100%"
      outline
      isDisabled={isLoading}
      onClick={() => {
        pay();
      }}>
      {isLoading ? (
        <Loader color="primary">
          <LoaderSVG />
        </Loader>
      ) : (
        <img src={PayPalLogo} style={{ maxHeight: "20px" }} />
      )}
    </Button>
  );
};
