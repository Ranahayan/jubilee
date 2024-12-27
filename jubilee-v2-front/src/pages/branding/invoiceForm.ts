import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "branded_invoice.store_name",
    key: "invoice_store_name",
    size: 12,
    isRequired: true,
  },
  {
    type: "email",
    labelKey: "branded_invoice.contact_email",
    key: "invoice_contact_email",
    size: 6,
    isRequired: true,
  },
  {
    type: "string",
    labelKey: "branded_invoice.website",
    key: "invoice_website",
    size: 6,
    isRequired: true,
  },
  {
    type: "textarea",
    labelKey: "branded_invoice.notes",
    key: "invoice_body",
    size: 12,
    isRequired: false,
  },
  {
    type: "file",
    labelKey: "branded_invoice.logo",
    key: "invoice_logo",
    placeholder: "branded_invoice.logo_input_placeholder",
    filetypes: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
    size: 12,
    isRequired: false,
  },
];
