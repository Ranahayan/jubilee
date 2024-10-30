import { SHOPIFY_COLLECTIONS } from "~/api/store/types";
import { FormFieldConfigs } from "~/types/form";

export const formConfig: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "dropshipping.product_name",
    key: "title",
    isRequired: true
  },
	{
    type: "tag",
    labelKey: "dropshipping.product_tags",
    key: "tags",
    isRequired: false,
    placeholder: "dropshipping.add_tag_placeholder"
  },
  {
    type: "string",
    labelKey: "dropshipping.product_category",
    key: "category_name",
    isRequired: false,
    isDisabled: true,
  },
  {
    type: "select",
    labelKey: "dropshipping.product_collection",
    key: "collections",
    isMulti: true,
    optionsQueryKey: SHOPIFY_COLLECTIONS,
    isRequired: false,
    placeholder: "dropshipping.select_collection_placeholder"
  },
];
