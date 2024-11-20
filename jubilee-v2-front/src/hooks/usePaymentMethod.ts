import { useAccount } from "./useAccount";

export const usePaymentMethod = () => {
  const { account } = useAccount();
  const isUserShopify = account?.payment_provider === "shopify";
  const isUserStripe = account?.payment_provider === "stripe";
  const isUserPaypal = account?.payment_provider === "paypal";

  return { isUserShopify, isUserStripe, isUserPaypal };
};
