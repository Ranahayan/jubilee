import { IconDefinition } from "@fortawesome/pro-light-svg-icons";
import {
  faBadgePercent,
  faCreditCard,
  faUser,
} from "@fortawesome/pro-solid-svg-icons";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { IAccount } from "~/types/account";
import { Tab } from "~/types/tabs";

export const settingsTabs = (account: IAccount | null): Array<Tab> => [
  ...(DISABLE_PAYMENTS
    ? []
    : [
        {
          labelKey: "settings.plans",
          path: "/settings/plans",
          icon: faBadgePercent as IconDefinition,
        },
      ]),
  {
    labelKey: "settings.account",
    path: "/settings/account",
    icon: faUser as IconDefinition,
  },
  ...(DISABLE_PAYMENTS && !account?.has_subscribed_before
    ? []
    : [
        {
          labelKey: "settings.membership",
          path: "/settings/membership",
          icon: faCreditCard as IconDefinition,
        },
      ]),
  // {
  //   labelKey: "nav.home",
  //   path: "/",
  // },
];
