import { FormFieldConfigs } from "~/types/form";

export const formConfigShipping: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "orders.first_name",
    key: "first_name",
    size: 6,
    isRequired: true,
  },
  {
    type: "string",
    labelKey: "orders.last_name",
    key: "last_name",
    size: 6,
    isRequired: true,
  },
  {
    type: "string",
    labelKey: "orders.address",
    key: "line_1",
    isRequired: true,
  },
  {
    type: "string",
    labelKey: "orders.address_2",
    key: "line_2",
  },
  {
    type: "string",
    labelKey: "orders.country_region",
    key: "country",
    isRequired: true,
    size: 6,
  },
  {
    type: "string",
    labelKey: "orders.phone_number",
    key: "phone",
    isRequired: true,
    size: 6,
  },
  {
    type: "string",
    labelKey: "orders.city",
    key: "city",
    size: 4,
    isRequired: true,
  },
  {
    type: "string",
    labelKey: "orders.state_province",
    key: "state",
    size: 4,
    isRequired: true,
  },
  {
    type: "string",
    labelKey: "orders.postal_code",
    key: "zip",
    size: 4,
    isRequired: true,
  },
];
