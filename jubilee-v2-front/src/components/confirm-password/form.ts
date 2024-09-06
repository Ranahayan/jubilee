import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    labelKey: "Password",
    type: "password",
    key: "password",
    placeholder: "********",
    isRequired: true,
  },
  {
    labelKey: "Confirm",
    type: "password",
    key: "confirm_password",
    placeholder: "********",
    isRequired: true,
  },
];
