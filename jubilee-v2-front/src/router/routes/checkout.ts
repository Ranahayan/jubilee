import { lazy } from "react";
import { fullscreen } from "~/helpers/routes";

import { paths } from "~/router/paths";

const Checkout = lazy(() => import("~/pages/checkout"));
const PaypalPaymentSuccess = lazy(
  () => import("~/pages/settings/paypal/payment-success")
);

export const routes: Array<any> = [
  {
    path: `${paths.checkout.index}`,
    element: fullscreen(Checkout),
  },
  {
    path: paths.checkout.paypalPaymentSuccess,
    element: fullscreen(PaypalPaymentSuccess),
  },
];
