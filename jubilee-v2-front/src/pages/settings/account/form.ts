import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "password",
    placeholder: "auth.please_old_password",
    key: "old_password",
    isRequired: true,
  },
  {
    type: "password",
    placeholder: "auth.please_new_password",
    key: "new_password1",
    isRequired: true,
  },
  {
    type: "password",
    placeholder: "auth.please_re_enter_password",
    key: "new_password2",
    isRequired: true,
  },
];

export const formConfigWithoutPassword: FormFieldConfigs = [
  {
    type: "password",
    placeholder: "auth.please_new_password",
    key: "new_password1",
    isRequired: true,
  },
  {
    type: "password",
    placeholder: "auth.please_re_enter_password",
    key: "new_password2",
    isRequired: true,
  },
];

export const nameFormConfig: FormFieldConfigs = [
  {
    type: "string",
    placeholder: "auth.your_name",
    key: "name",
    isRequired: true,
  },
];

export const emailFormConfig: FormFieldConfigs = [
  {
    type: "email",
    placeholder: "auth.email",
    key: "email",
    isRequired: true,
  },
];
