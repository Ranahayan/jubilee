import { lazy } from "react";
import { guest } from "~/helpers/routes";

import { paths } from "~/router/paths";

const StoreLogin = lazy(() => import("~/pages/store-login"));
const LoginPage = lazy(() => import("~/pages/login"));
const RegisterPage = lazy(() => import("~/pages/register"));
const ForgotPasswordPage = lazy(() => import("~/pages/forgot-password"));

export const routes: Array<any> = [
  {
    path: `${paths.auth.store_login}:shop_token`,
    element: <StoreLogin />,
  },
  {
    path: paths.auth.login,
    element: guest(LoginPage),
  },
  {
    path: paths.auth.register,
    element: guest(RegisterPage),
  },
  {
    path: paths.auth.forgot,
    element: <ForgotPasswordPage />,
  }
];
