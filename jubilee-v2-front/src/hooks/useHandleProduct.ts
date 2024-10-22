import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import handleErrors, { ToastMessage } from "../helpers/handleErrors";
import { usePlanFeature } from "~/hooks/usePlanFeature";
import {
  triggerShowLimitsModal,
  triggerShowResumeModal,
} from "../helpers/customEvents";
import { addToImportList } from "~/api/dropshipping/requests";
import { IMPORT_LIST, ORDERS, PRODUCTS } from "~/api/dropshipping/types";
import {
  SIDEBAR_COUNT_IMPORTED_PRODUCTS,
  SIDEBAR_COUNT_SAMPLE_ORDERS,
} from "~/api/sidebarCounts/types";
import { useCreateSampleOrder } from "~/api/dropshipping/queries";
import { Limits } from "~/types/billing";
import { triggerGTMAddToImportList } from "~/helpers/gtm";
import { IProduct } from "~/types/dropshipping";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";

type Props = {
  categoryId?: number;
  search?: string;
};

const useHandleProduct = ({ categoryId, search }: Props) => {
  const { isFeatureDisabled, isFeaturePaused } = usePlanFeature();
  const queryClient = useQueryClient();
  const { mutateAsync: createSampleOrder } = useCreateSampleOrder();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const markProductAsImported = async (id: string) => {
    const key = [...PRODUCTS, { category: categoryId, search_term: search }];
    const cache: any = queryClient.getQueryData(key);
    const data: any = JSON.parse(JSON.stringify(cache));

    for (const page of data?.pages) {
      for (const product of page.data) {
        if (product.id === id) {
          product.is_imported = true;
        }
      }
    }

    queryClient.setQueryData(key, data);
  };

  const handleAddToImportList = async (product: IProduct) => {
    const toastMessages = {
      loading: t("dropshipping.loading_add"),
      success: t("dropshipping.success_add"),
      error: t("dropshipping.error_add"),
    };

    if (isFeatureDisabled(Limits.PAID_PLAN)) {
      return triggerShowLimitsModal(Limits.PAID_PLAN);
    }

    const { errors } = await handleErrors(
      () => addToImportList(product.id),
      toastMessages
    );

    if (!errors) {
      queryClient.refetchQueries(IMPORT_LIST);
      queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
      markProductAsImported(product.id);
      triggerGTMAddToImportList(product);
    }
  };

  const handleSampleOrder = async (variant_id: number, isPremium?: boolean) => {
    if (isFeaturePaused()) return triggerShowResumeModal();

    if (isFeatureDisabled(Limits.PAID_PLAN)) {
      return triggerShowLimitsModal(Limits.PAID_PLAN);
    }

    if (isPremium && isFeatureDisabled(Limits.PREMIUM_PRODUCTS)) {
      return triggerShowLimitsModal(Limits.PREMIUM_PRODUCTS);
    }

    const payload = {
      variant_id,
      quantity: 1,
      additive: true,
    };

    const toastMessages = {
      loading: t("dropshipping.loading_sample_order"),
      success: {
        body: t("dropshipping.success_sample_order"),
        options: {
          inlineAction: {
            label: t("dropshipping.success_sample_order_link"),
            onClick: () => navigate(paths.app.sampleOrders),
          },
        },
      },
      error: t("dropshipping.error_sample_order"),
    } satisfies ToastMessage;

    await handleErrors(() => createSampleOrder(payload), toastMessages);
    queryClient.refetchQueries(ORDERS);
    queryClient.refetchQueries(SIDEBAR_COUNT_SAMPLE_ORDERS);
  };

  return { handleAddToImportList, handleSampleOrder };
};

export default useHandleProduct;
