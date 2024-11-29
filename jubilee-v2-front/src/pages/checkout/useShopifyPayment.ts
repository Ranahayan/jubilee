import { useShopifySubscription } from "~/api/billing/queries";

export const useShopifyPayment = (planId: string) => {
  const { mutateAsync: shopifySubscription } = useShopifySubscription();

  const payShopify = () => shopifySubscription({ plan_id: planId });

  const pay = async () => {
    const response = await payShopify();
    if (response.confirmation_url)
      window.location.replace(response.confirmation_url);
    return response;
  };

  return pay;
};
