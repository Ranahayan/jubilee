import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "string",
    key: "name",
    placeholder: "checkout.name_card",
    isRequired: true,
  },
  {
    type: "card",
    key: "payment_method_id",
    isRequired: true,
  },
];
