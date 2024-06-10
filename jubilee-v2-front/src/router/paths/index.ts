import { IRootPaths } from "~/types/routing";

import { paths as auth } from "~/router/paths/auth";
import { paths as app } from "~/router/paths/app";
import { paths as settings } from "~/router/paths/settings";
import { paths as checkout } from "~/router/paths/checkout";

export const paths: IRootPaths = {
  auth,
  app,
  checkout,
  settings,
};
