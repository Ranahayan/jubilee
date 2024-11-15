import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "branding.brand_field",
    key: "brand_name",
		size: 12,
    isRequired: true
  },
  {
    type: "string",
    labelKey: "branding.distributor_city",
    key: "distributor_city",
    size: 6,
    isRequired: true
  },
  {
    type: "string",
    labelKey: "branding.distributor_zip",
    key: "distributor_zip",
    size: 6,
    isRequired: true
  },
];
