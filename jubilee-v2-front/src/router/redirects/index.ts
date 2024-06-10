import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { paths } from "~/router/paths";

export const redirectRoutes = [
  {
    path: paths.settings.index,
    to: DISABLE_PAYMENTS ? paths.settings.account : paths.settings.plans,
  },
];
