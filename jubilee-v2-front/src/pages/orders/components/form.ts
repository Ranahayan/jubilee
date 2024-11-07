import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "dropshipping.full_name",
    key: "name",
    isRequired: true,
  },
  {
    type: "card",
    labelKey: "dropshipping.credit_card",
    key: "payment_method_id",
    isRequired: true,
  },
];
