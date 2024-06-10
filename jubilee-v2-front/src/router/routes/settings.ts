import { lazy } from "react";

import { app } from "~/helpers/routes";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { paths } from "~/router/paths";

const AccountSettingsPage = lazy(() => import("~/pages/settings/account"));
const PlansSettingsPage = lazy(() => import("~/pages/settings/plans"));
const MembershipSettingsPage = lazy(
  () => import("~/pages/settings/membership")
);

export const routes: Array<any> = [
  {
    path: paths.settings.account,
    element: app(AccountSettingsPage),
  },
  ...(DISABLE_PAYMENTS
    ? []
    : [
        {
          path: paths.settings.plans,
          element: app(PlansSettingsPage),
        },
      ]),
  {
    path: paths.settings.membership,
    element: app(MembershipSettingsPage),
  },
];
