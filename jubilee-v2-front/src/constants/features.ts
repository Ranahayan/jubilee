import { TFunction } from "i18next";
import { Limits } from "~/types/billing";

const translationKeys = {
  branded_invoice: {
    titleWithAbovePlans: "features.branded_invoice.title_with_above",
    title: "features.branded_invoice.title",
    description: "features.branded_invoice.description",
    testimonial: "features.branded_invoice.testimonial",
  },
  live_products: {
    titleWithAbovePlans: "features.live_products.title_with_above",
    title: "features.live_products.title",
    description: "features.live_products.description",
    testimonial: "features.live_products.testimonial",
  },
  paid_plan: {
    titleWithAbovePlans: "features.paid_plan.title_with_above",
    title: "features.paid_plan.title",
    description: "features.paid_plan.description",
    testimonial: "features.paid_plan.testimonial",
  },
  premium_products: {
    titleWithAbovePlans: "features.premium_products.title_with_above",
    title: "features.premium_products.title",
    description: "features.premium_products.description",
    testimonial: "features.premium_products.testimonial",
  },
  customized_product_image_background: {
    titleWithAbovePlans: "features.customized_background.title_with_above",
    title: "features.customized_background.title",
    description: "features.customized_background.description",
    testimonial: "features.customized_background.testimonial",
  },
} satisfies Record<
  Limits,
  {
    title: string;
    titleWithAbovePlans: string;
    description: string;
    testimonial: string;
  }
>;

export const planEmojis: Record<string, string> = {
  starter: "⭐",
  pro: "✨",
  empire: "👑",
  unicorn: "🦄"
};

export const getFeaturesTranslations = (
  t: TFunction,
  limitType: Limits,
  planName: string,
  hasAbovePlans: boolean
) => {
  const translations = translationKeys[limitType];

  return {
    title: t(
      hasAbovePlans ? translations.titleWithAbovePlans : translations.title,
      { planName }
    ),
    description: t(translations.description, { planName }),
    testimonial: t(translations.testimonial, { planName }),
  };
};