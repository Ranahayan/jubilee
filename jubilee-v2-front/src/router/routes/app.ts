import { lazy } from "react";
import ReviewsPromotionPage from "~/components/PromoReviewsPro/PromotionPage";
import { app, fullscreen } from "~/helpers/routes";
import { paths } from "~/router/paths";

const DashboardPage = lazy(() => import("~/pages/dashboard"));
const WinningAds = lazy(() => import("~/pages/winning-ads"));
const HomePage = lazy(() => import("~/pages/home"));
const OrdersPage = lazy(() => import("~/pages/orders"));
const ImportListPage = lazy(() => import("~/pages/import-list"));
const LiveProductsPage = lazy(() => import("~/pages/live-products"));
const Branding = lazy(() => import("~/pages/branding"));
const CancelationPage = lazy(() => import("~/pages/cancel"));

export const routes: Array<any> = [
  {
    path: paths.app.home,
    element: app(DashboardPage),
  },
  {
    path: paths.app.winningAds,
    element: app(WinningAds),
  },
  {
    path: paths.app.findProduct,
    element: app(HomePage),
  },
  {
    path: paths.app.orders,
    element: app(OrdersPage, paths.app.orders),
  },
  {
    path: paths.app.sampleOrders,
    element: app(OrdersPage, paths.app.sampleOrders),
  },
  {
    path: paths.app.importList,
    element: app(ImportListPage),
  },
  {
    path: paths.app.promoReviews,
    element: app(ReviewsPromotionPage),
  },
  {
    path: paths.app.liveProducts,
    element: app(LiveProductsPage),
  },
  {
    path: paths.app.branding,
    element: app(Branding),
  },
  {
    path: paths.app.cancel,
    element: fullscreen(CancelationPage),
  },
];
