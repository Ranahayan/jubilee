import { IPaths } from "~/types/routing";

export const paths: IPaths = {
  index: "/checkout",
  paypalPaymentSuccess: "/checkout/paypal/payment-success/:subscriptionId",
};
