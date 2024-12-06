import { t } from "i18next";

type IWinningsOffer = {
  title: string,
  description: string,
  icon: string
}

export const winningsOffer: Array<IWinningsOffer> = [
  {
    title: t("dropshipping.millions_of_trending_products"),
    description: t("dropshipping.millions_of_trending_products_description"),
    icon: "https://alidrop-production-frontend-app.s3.us-east-1.amazonaws.com/assets/winning_ads/ads-1.avif",
  },
  {
    title: t("dropshipping.competitor_research"),
    description: t("dropshipping.competitor_research_description"),
    icon: "https://alidrop-production-frontend-app.s3.us-east-1.amazonaws.com/assets/winning_ads/ads-2.avif",
  },
  {
    title: t("dropshipping.product_portfolio"),
    description: t("dropshipping.product_portfolio_description"),
    icon: "https://alidrop-production-frontend-app.s3.us-east-1.amazonaws.com/assets/winning_ads/ads-3.avif",
  },
  {
    title: t("dropshipping.sales_tracker"),
    description: t("dropshipping.sales_tracker_description"),
    icon: "https://alidrop-production-frontend-app.s3.us-east-1.amazonaws.com/assets/winning_ads/ads_4.avif",
  },
];
