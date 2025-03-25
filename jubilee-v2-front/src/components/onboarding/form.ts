import { FormFieldConfigs } from "~/types/form";

export const brandingFormConfig: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "branding.brand_field",
    key: "brand_name",
    placeholder: "onboarding.brand_name_placeholder",
    style: { padding: "8px 16px" },
    isRequired: false,
  },
  {
    type: "file",
    labelKey: "branding.logo_field",
    key: "brand_logo",
    placeholder: "branding.logo_field_placeholder",
    filetypes: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
    isRequired: false,
  },
];
