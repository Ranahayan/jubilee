import { makeRedirects } from "~/helpers/routes";

import { routes as app } from "~/router/routes/app";
import { routes as auth } from "~/router/routes/auth";
import { routes as settings } from "~/router/routes/settings";
import { routes as checkout } from "~/router/routes/checkout";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

export const routes = [
  ...app,
  ...auth,
  ...settings,
  ...(DISABLE_PAYMENTS ? [] : checkout),
  ...makeRedirects(),
];
