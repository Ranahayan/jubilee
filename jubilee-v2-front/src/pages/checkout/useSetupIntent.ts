import { useStripeIntent } from "~/api/billing/queries";
import { IAccount } from "~/types/account";

export const useSetupIntent = () => {
  const { mutateAsync: stripeIntent } = useStripeIntent();

  const getSetupIntent = async (account?: IAccount | null) => {
    if (!account) return;
    return stripeIntent();
  };

  return getSetupIntent;
};
