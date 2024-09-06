import { t } from "i18next";
import { FormFieldConfigs, FormFieldValue } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "email",
    labelKey: "auth.email",
    key: "email",
    isRequired: true,
    placeholder: "auth.your_email",
    noStandardValidationForm: true,
    validationOnSubmit: true,
    validation: (value: FormFieldValue) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return t('auth.invalid_email');
      }
      return null;
    },
  },
  {
    type: "string",
    labelKey: "auth.name",
    key: "name",
    isRequired: true,
    placeholder: "auth.your_name",
  },
];
