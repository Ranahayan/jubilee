import { useState, useEffect } from "react";
import PageTitle from "~/components/ui/PageTitle";
import {
  useGetImportList,
  useUpdateImportListBulk,
} from "~/api/dropshipping/queries";
import { Trans, useTranslation } from "react-i18next";
import handleErrors from "~/helpers/handleErrors";
import {
  bulkUpdateVariants,
  deleteImportedProduct,
  deleteImportedProductBulk,
  pushToStore,
  updateImportedProduct,
} from "~/api/dropshipping/requests";
import { useQueryClient } from "@tanstack/react-query";
import {
  IMPORT_LIST,
  IProductVariantsPayload,
  PRODUCTS,
} from "~/api/dropshipping/types";
import Loader from "~/components/ui/Loader";
import { Pagination } from "~/components/ui/Pagination";
import FlexContainer from "~/components/ui/FlexContainer";
import { EmptyState } from "~/components/ui/EmptyState";
import { faXmarkToSlot } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "~/components/ui/SVG/types";
import { usePlanFeature } from "~/hooks/usePlanFeature";
import { Limits } from "~/types/billing";
import {
  SIDEBAR_COUNT_IMPORTED_PRODUCTS,
  SIDEBAR_COUNT_LIVE_PRODUCTS,
} from "~/api/sidebarCounts/types";
import { PAGE_SIZE } from "~/constants/page";
import { triggerShowLimitsModal } from "~/helpers/customEvents";
import Modal from "~/components/ui/Modal";
import { ConnectToStore } from "~/components/connect-to-store";
import { IProduct, IPushToStoreParams } from "~/types/dropshipping";
import * as S from "./styles";
import { Search } from "~/components/search";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import Button from "~/components/ui/Button";
import { DialogModal } from "~/components/dialogModal";
import {
  faCircleExclamation,
  faCircleExclamationCheck,
} from "@fortawesome/pro-regular-svg-icons";
import { useDropshippingSocket } from "~/hooks/useDropshippingSocket";
import { useAccount } from "~/hooks/useAccount";
import { ProductCard } from "./components/ProductCard";
import { toast } from "~/components/toast";

const ImportListPage = () => {
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const isAboveTablet = useMediaQuery("tablet");
  const {
    data: products,
    isLoading,
    refetch,
  } = useGetImportList({
    page: page,
    ...(search ? { search_term: search } : {}),
  });
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { isFeatureDisabled } = usePlanFeature();
  const totalCount = (products?.total_pages as number) * PAGE_SIZE - 1;
  const { mutateAsync: bulkUpdate } = useUpdateImportListBulk();
  const { account } = useAccount();
  const { connect } = useDropshippingSocket();

  const handleSocketMessage = (message: { type: string; success: boolean }) => {
    const messageTypes: {
      [x: string]: { success_key: string; error_key: string };
    } = {
      SYNC_PRODUCT_VARIANTS: {
        success_key: "dropshipping.variant_sync_complete_success",
        error_key: "dropshipping.variant_sync_complete_error",
      },
      DELETE_IMPORTED_PRODUCTS: {
        success_key: "dropshipping.delete_imported_complete_success",
        error_key: "dropshipping.delete_imported_complete_error",
      },
      UPDATE_IMPORTED_PRODUCTS: {
        success_key: "dropshipping.update_imported_complete_success",
        error_key: "dropshipping.update_imported_complete_error",
      },
    };
    const msg = messageTypes[message.type];
    if (!msg) return;

    if (message.success) {
      toast.success(t(msg.success_key));
      refetch();
    } else {
      toast.error(t(msg.error_key));
    }

    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_LIVE_PRODUCTS);
    queryClient.refetchQueries(IMPORT_LIST);
    queryClient.refetchQueries(PRODUCTS);
    setLoading(false);
  };

  useEffect(() => {
    let socket: WebSocket | null = null;
    if (account?.id) {
      socket = connect(account.id, handleSocketMessage);
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [account?.id]);

  const handlePushToStore = async (product: IProduct) => {
    setLoading(true);

    const toastMessages = {
      loading: t("dropshipping.loading_push"),
      success: t("dropshipping.success_push"),
      error: t("dropshipping.error_push"),
    };

    const payload: IPushToStoreParams = {
      is_live: true,
      title: product.title,
      product_id: product.id,
      description: product.description,
      tags: product?.tags ?? [],
      collections: product?.collections ?? []
    };

    const { response, errors } = await handleErrors(
      () => pushToStore(payload),
      toastMessages
    );

    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_LIVE_PRODUCTS);
    queryClient.refetchQueries(IMPORT_LIST);
    queryClient.refetchQueries(PRODUCTS);
    setLoading(false);

    if (!response) {
      if (errors?.[0] === "Shop doesn't exist")
        return setShowConnectModal(true);

      if (product.is_premium && isFeatureDisabled(Limits.PREMIUM_PRODUCTS)) {
        return triggerShowLimitsModal(Limits.PREMIUM_PRODUCTS);
      }

      if (isFeatureDisabled(Limits.LIVE_PRODUCTS)) {
        return triggerShowLimitsModal(Limits.LIVE_PRODUCTS);
      }

      if (isFeatureDisabled(Limits.PAID_PLAN)) {
        return triggerShowLimitsModal(Limits.PAID_PLAN);
      }
    }
  };

  const handleDeleteProduct = async (product_id: string) => {
    const toastMessages = {
      loading: t("dropshipping.loading_remove"),
      success: t("dropshipping.success_remove"),
      error: t("dropshipping.error_remove"),
    };

    await handleErrors(() => deleteImportedProduct(product_id), toastMessages);
    queryClient.invalidateQueries(IMPORT_LIST);
    queryClient.refetchQueries(PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
  };

  const handleUpdateProduct = async (productData: Partial<IProduct>) => {
    const toastMessages = {
      loading: t("dropshipping.loading_update"),
      success: t("dropshipping.success_update"),
      error: t("dropshipping.error_update"),
    };

    await handleErrors(() => updateImportedProduct(productData), toastMessages);
    queryClient.invalidateQueries(IMPORT_LIST);
    queryClient.refetchQueries(PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    const productIds = products?.data?.map((p) => p.id) || [];

    const toastMessages = {
      loading: t("dropshipping.loading_bulk_delete"),
      success: t("dropshipping.success_bulk_delete"),
      error: t("dropshipping.error_bulk_delete"),
    };

    await handleErrors(
      () => deleteImportedProductBulk({ product_ids: productIds }),
      toastMessages
    );
  };

  const handleBulkPush = async () => {
    const payload = products?.data?.map((product) => ({
      is_live: true,
      title: product.title,
      product_id: product.id,
      description: product.description,
      tags: product?.tags ?? [],
      collections: product?.collections ?? []
    }));

    if (!payload) return;

    setLoading(true);

    const toastMessages = {
      loading: t("dropshipping.loading_bulk_push"),
      success: t("dropshipping.success_bulk_push"),
      error: t("dropshipping.error_bulk_push"),
    };

    await handleErrors(() => bulkUpdate({ products: payload }), toastMessages);
  };

  const handleBulkUpdateVariants = async (payload: IProductVariantsPayload) => {
    const toastMessages = {
      loading: t("dropshipping.updating_variants"),
      success: t("dropshipping.update_variants_success"),
      error: t("dropshipping.update_variants_error"),
    };

    await handleErrors(() => bulkUpdateVariants(payload), toastMessages);
  };

  const isEmpty = products?.data?.length === 0 || (!products && !isLoading);

  return (
    <FlexContainer flexDirection="column" width="100%">
      <PageTitle fontWeight={700}>{t("nav.import_list")}</PageTitle>
      <S.Header
        flexDirection={isAboveTablet ? "row" : "column"}
        width="100%"
        justifyContent="space-between">
        <Search
          placeholder={t("dropshipping.search") as string}
          onClick={(searchTerm) => setSearch(searchTerm)}
          width={isAboveTablet ? "50%" : "100%"}
        />
        <FlexContainer>
          <Button
            color="text"
            bgColor="white"
            padding="12px 18px"
            isDisabled={isEmpty}
            onClick={() => setShowDelete(true)}
            alignSelf="center">
            <Trans i18nKey="dropshipping.remove_all_bulk" />
          </Button>
          <Button
            color="white"
            bgColor="primary"
            padding="12px 18px"
            isDisabled={isEmpty}
            onClick={() => setShowPush(true)}
            alignSelf="center">
            <Trans i18nKey="dropshipping.push_all_bulk" />
          </Button>
        </FlexContainer>
      </S.Header>
      <FlexContainer flexDirection="column" gap="20px" width="100%">
        {products?.data?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={loading}
            handleBulkUpdateVariants={handleBulkUpdateVariants}
            updateProduct={handleUpdateProduct}
            pushToStore={handlePushToStore}
            deleteProduct={handleDeleteProduct}
          />
        ))}
      </FlexContainer>
      {products?.data && products?.data?.length > 0 ? (
        <Pagination
          totalCount={totalCount}
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalPages={products?.total_pages as number}
          onPageChange={(page) => setPage(page as number)}
        />
      ) : null}
      {loading || isLoading ? <Loader /> : null}
      {isEmpty ? (
        <EmptyState
          title={t("dropshipping.import_list_empty_state_title")}
          description={t("dropshipping.import_list_empty_state_desc")}
          icon={faXmarkToSlot as SVGIcon}
        />
      ) : null}
      <DialogModal
        id="delete-imported-product"
        isShowing={showDelete}
        icon={faCircleExclamation}
        hide={() => setShowDelete(false)}
        title={t("dropshipping.delete_products")}
        description={t("dropshipping.delete_products_desc")}
        buttonText={t("dropshipping.delete")}
        buttonCancelText={t("dropshipping.cancel")}
        buttonColor="primary"
        handleAction={handleBulkDelete}
      />
      <DialogModal
        id="push-imported-product"
        isShowing={showPush}
        icon={faCircleExclamationCheck}
        hide={() => setShowPush(false)}
        title={t("dropshipping.push_product")}
        description={t("dropshipping.push_product_desc")}
        buttonText={t("dropshipping.push_modal")}
        buttonCancelText={t("dropshipping.cancel")}
        buttonColor="primary"
        handleAction={handleBulkPush}
      />
      <Modal
        id="connect-to-store"
        hide={() => setShowConnectModal(false)}
        isShowing={showConnectModal}
        padding="24px"
        minWidth="min(90%, 482px)">
        <ConnectToStore />
      </Modal>
    </FlexContainer>
  );
};

export default ImportListPage;
