import { CustomizationTab } from "~/types/customization";
import { FormFieldConfigs } from "~/types/form";

export const mergeFields = (tabs: CustomizationTab[]): any[] => {
  const allFields: FormFieldConfigs = [];

  for (const tab of tabs) {
    for (const section of tab?.sections || []) {
      allFields.push(...section.fields);
    }
  }

  return allFields;
};
