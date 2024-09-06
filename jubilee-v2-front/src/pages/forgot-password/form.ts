import { FormFieldConfigs } from "~/types/form";

export const formConfigEmail: FormFieldConfigs = [
  {
    type: "string",
    key: "email",
    placeholder: "auth.your_email",
    isRequired: true,
  },
];

export const formConfigReset: FormFieldConfigs = [
  {
    type: "password",
    labelKey: "auth.password",
    key: "password",
    isRequired: true,
  },
  {
    type: "password",
    labelKey: "auth.confirm_password",
    key: "repeat_password",
    isRequired: true,
  },
];
