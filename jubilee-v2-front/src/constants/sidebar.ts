import { Icon } from "@fortawesome/fontawesome-svg-core";
import {
  faSearch,
  faCog,
  faLifeRing,
  faCartShopping,
  faBagShopping,
  faSquareList,
  faTags,
  faFileInvoice,
  faBell,
  faStore,
  faHome,
  faChartKanban,
} from "@fortawesome/pro-light-svg-icons";
import { paths } from "~/router/paths";
import { INavItem } from "~/types/routing";
import {
  useGetSidebarCountLiveProducts,
  useGetSidebarCountImportedProducts,
  useGetSidebarCountSampleOrders,
  useGetSidebarCountShopifyOrders,
} from "~/api/sidebarCounts/queries";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { useGetUnreadNotifications } from "~/api/notifications/queries";
import {
  triggerShowConnectStoreModal,
  triggerShowNotifications,
} from "~/helpers/customEvents";

const starIcon =
  "https://s3.us-west-2.amazonaws.com/assets.spocket.co/star.svg";

import DropshipToolLogo from "~/assets/svg/dropshiptool_logo.svg?react";

export const navItems: Array<INavItem> = [
  {
    sectionLabel: "nav.title_home",
    namePath: "nav.dashboard",
    path: paths.app.home,
    icon: faHome,
  },
  {
    namePath: "nav.find_winning_ads",
    path: paths.app.winningAds,
    icon: DropshipToolLogo,
  },
  {
    sectionLabel: "nav.title_find_products",
    namePath: "nav.find_products",
    path: paths.app.findProduct,
    icon: faSearch as Icon,
  },
  {
    namePath: "nav.branding",
    path: paths.app.branding,
    icon: faFileInvoice as Icon,
  },
  {
    sectionLabel: "nav.title_products",
    namePath: "nav.import_list",
    path: paths.app.importList,
    icon: faSquareList as Icon,
    getCountQuery: useGetSidebarCountImportedProducts,
  },

  {
    namePath: "nav.reviews",
    path: paths.app.promoReviews,
    icon: starIcon as any,
    isOnlySVG: true,
    isNew: true,
  },

  {
    namePath: "nav.live_products",
    path: paths.app.liveProducts,
    icon: faTags as Icon,
    getCountQuery: useGetSidebarCountLiveProducts,
  },
  {
    sectionLabel: "nav.title_orders",
    namePath: "nav.orders",
    path: paths.app.orders,
    icon: faCartShopping as Icon,
    getCountQuery: useGetSidebarCountShopifyOrders,
  },
  {
    namePath: "nav.sample_orders",
    path: paths.app.sampleOrders,
    icon: faBagShopping as Icon,
    getCountQuery: useGetSidebarCountSampleOrders,
  },
  {
    namePath: "settings.title",
    path: DISABLE_PAYMENTS ? paths.settings.account : paths.settings.plans,
    icon: faCog as Icon,
  },
  {
    namePath: "nav.notifications",
    path: "/notifications",
    icon: faBell as Icon,
    onClick: () => triggerShowNotifications(),
    getCountQuery: useGetUnreadNotifications,
  },
  {
    namePath: "nav.connect-store",
    path: "/connect-store",
    icon: faStore as Icon,
    onClick: () => triggerShowConnectStoreModal(),
  },
  {
    namePath: "nav.help_center",
    path: "https://www.notion.so/Jubilee-1f30c13273a280e58b3ccd3253073ca7",
    openInNewTab: true,
    icon: faLifeRing as Icon,
    // Uncomment this to show help center as a modal
    showHelpCenterModal: true,
  },
];
