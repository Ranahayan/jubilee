import { paths } from "~/router/paths";

export const excludePaths: string[] = [
  paths.auth.store_login,
  paths.auth.login,
  paths.auth.register,
  paths.auth.forgot,
  paths.checkout.index.replace(":id", ""),
  paths.settings.index,
];
