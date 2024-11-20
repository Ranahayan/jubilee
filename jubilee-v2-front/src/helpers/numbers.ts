import { IPlan, SubscriptionType } from "~/types/billing";

export const centsToDecimal = (cents: number): number => {
  return cents / 100;
};

export const splitNumber = (number: number | string) => {
  const fixed = Number(number);
  const integerPart = Math.floor(fixed);
  const decimalPart = (fixed - integerPart).toFixed(2).slice(1);

  return {
    integer: integerPart,
    decimal: decimalPart === ".00" ? "" : decimalPart,
  };
};

export const decimalToCents = (decimal: number): number => {
  return decimal * 100;
};

export const getTotalPlanCost = (plan: IPlan | null | undefined) => {
  const costPerMonth = plan?.cost_per_month
    ? centsToDecimal(plan?.cost_per_month)
    : 0;
  const annualValue = costPerMonth * 12;
  const isAnnual = plan?.interval === SubscriptionType.ANNUAL;
  return isAnnual ? annualValue : costPerMonth;
};

export const formatPercentage = (percent: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(percent < 1 ? percent : percent / 100);
};

export const formatCurrency = (value: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
};
