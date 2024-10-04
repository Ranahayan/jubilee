export const sortingOptions = [
  { value: null, labelKey: "dropshipping.sort_random" },
  {
    value: { sort_by_created_at: "desc" },
    labelKey: "dropshipping.sort_created_at_desc",
  },
  { value: { sort_by_price: "asc" }, labelKey: "dropshipping.sort_price_asc" },
  {
    value: { sort_by_price: "desc" },
    labelKey: "dropshipping.sort_price_desc",
  },
  {
    value: { sort_by_number_of_orders: "desc" },
    labelKey: "dropshipping.sort_orders_desc",
  },
] as const;

export type Sorting = (typeof sortingOptions)[number]["value"] extends infer T
  ? T extends Record<infer TKey, infer V>
    ? { [K in Exclude<SortingKey, TKey>]?: undefined } & { [K in TKey]: V }
    : null
  : null;

export const sortingKeys = [
  "sort_by_price",
  "sort_by_created_at",
  "sort_by_number_of_orders",
] as const;

export type SortingKey = (typeof sortingKeys)[number];

export const getSortingOption = (
  getValue: (key: string) => string | null
): Sorting => {
  const option = sortingOptions.find((option) => {
    if (option.value === null) return false;

    const key = Object.keys(option.value)[0] as SortingKey;
    // @ts-expect-error
    const value = option.value[key];

    return getValue(key) === value;
  });

  if (option) {
    return option.value;
  }

  return null;
};
