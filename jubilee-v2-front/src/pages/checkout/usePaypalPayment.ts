import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePaypalSubscription } from "~/api/billing/queries";
import { toast } from "~/components/toast";

export const usePaypalPayment = (planId: string) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: PaypalSubscription } = usePaypalSubscription();

  const payPaypal = () => PaypalSubscription({ plan_id: planId });

  const pay = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await payPaypal();
      if (response.payment_url) {
        window.location.replace(response.payment_url);
        return;
      }
    } catch {
      setIsLoading(false);
      toast.error(t("checkout.paypal_error"));
    }

    setIsLoading(false);
  };

  return { pay, isLoading };
};
