import { Fragment, useCallback, useEffect, useState } from "react";
import * as S from "./styles";
import {
  useGetImportList,
  useUpdateImportListBulk,
} from "~/api/dropshipping/queries";
import ProductCard from "~/pages/home/components/ProductCard";
import FlexContainer from "~/components/ui/FlexContainer";
import { PageTitle } from "~/components/ui/PageTitle/styles";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import {
  faCircleDot,
  faCircleExclamation,
  faCircleExclamationCheck,
} from "@fortawesome/pro-regular-svg-icons";
import { PulseIcon } from "./styles";
import handleErrors from "~/helpers/handleErrors";
import {
  deleteImportedProduct,
  deleteImportedProductBulk,
  pushToStore,
} from "~/api/dropshipping/requests";
import {
  IMPORT_LIST,
  ImportListFilter,
  PRODUCTS,
} from "~/api/dropshipping/types";
import { useQueryClient } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { Pagination } from "~/components/ui/Pagination";
import { EmptyState } from "~/components/ui/EmptyState";
import { faBoxOpen } from "@fortawesome/pro-solid-svg-icons";
import {
  SIDEBAR_COUNT_IMPORTED_PRODUCTS,
  SIDEBAR_COUNT_LIVE_PRODUCTS,
} from "~/api/sidebarCounts/types";
import { PAGE_SIZE } from "~/constants/page";
import { Search } from "~/components/search";
import { Filters } from "~/components/filters";
import { LiveProductsFilters } from "~/constants/filters";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { FilterTags } from "./components/FilterTags";
import Button from "~/components/ui/Button";
import { IProduct } from "~/types/dropshipping";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { DialogModal } from "~/components/dialogModal";
import useHandleProduct from "~/hooks/useHandleProduct";
import { toast } from "~/components/toast";
import { useDropshippingSocket } from "~/hooks/useDropshippingSocket";
import { useAccount } from "~/hooks/useAccount";

const LiveProductsPage = () => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ImportListFilter[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<IProduct[]>([]);
  const { data: products, isLoading, refetch } = useGetImportList({
    is_live: true,
    page: page,
    ...(search ? { search_term: search } : {}),
    ...(filters ? { filter: filters.join(",") } : {}),
  });
  const { mutateAsync: bulkUpdate } = useUpdateImportListBulk();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isAboveTablet = useMediaQuery("tablet");
  const totalCount = (products?.total_pages as number) * PAGE_SIZE - 1;
  const [showDelete, setShowDelete] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const { handleAddToImportList, handleSampleOrder } = useHandleProduct({});
  const { account } = useAccount();
  const { connect } = useDropshippingSocket();

  const handleSocketMessage = (message: { type: string; success: boolean }) => {
    const messageTypes: {
      [x: string]: { success_key: string; error_key: string };
    } = {
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
    if(!msg) return;

    if(message.success) {
      toast.success(t(msg.success_key));
      refetch();
    } else {
      toast.error(t(msg.error_key));
    }
    
    queryClient.refetchQueries(IMPORT_LIST);
    queryClient.invalidateQueries(PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_LIVE_PRODUCTS);
    setLoading(false);
    setSelected([]);
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

  const handleDeleteProduct = async (product_id: string) => {
    const toastMessages = {
      loading: t("dropshipping.loading_remove"),
      success: t("dropshipping.success_remove"),
      error: t("dropshipping.error_remove"),
    };

    await handleErrors(() => deleteImportedProduct(product_id), toastMessages);
    queryClient.refetchQueries(IMPORT_LIST);
    queryClient.invalidateQueries(PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_LIVE_PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
  };

  const handleRestore = async (product_id: string, description: string) => {
    setLoading(true);
    const toastMessages = {
      loading: t("dropshipping.loading_restore"),
      success: t("dropshipping.success_restore"),
      error: t("dropshipping.error_restore"),
    };

    const payload = {
      product_id: product_id,
      description: description,
      is_live: false,
    };

    await handleErrors(() => pushToStore(payload), toastMessages);
    queryClient.refetchQueries(IMPORT_LIST);
    queryClient.invalidateQueries(PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
    queryClient.invalidateQueries(SIDEBAR_COUNT_LIVE_PRODUCTS);
    setLoading(false);
  };

  const handleSelect = useCallback(
    (product: IProduct) => {
      if (selected.includes(product)) {
        setSelected(selected.filter((elm) => elm !== product));
      } else {
        setSelected([...selected, product]);
      }
    },
    [selected, setSelected]
  );

  const handleBulkUpdate = async () => {
    setLoading(true);
    const payload = selected.map((product) => ({
      product_id: product.id,
      description: product.description,
      is_live: false,
    }));

    const toastMessages = {
      loading: t("dropshipping.loading_bulk_update"),
      success: t("dropshipping.success_bulk_update"),
      error: t("dropshipping.error_bulk_update"),
    };

    await handleErrors(() => bulkUpdate({ products: payload }), toastMessages);
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    const product_ids = selected.map((product) => product.id);

    const toastMessages = {
      loading: t("dropshipping.loading_bulk_delete"),
      success: t("dropshipping.success_bulk_delete"),
      error: t("dropshipping.error_bulk_delete"),
    };

    await handleErrors(
      () => deleteImportedProductBulk({ product_ids }),
      toastMessages
    );
  };

  const orderSample = async (product_id: number, is_premium: boolean) => {
    await handleSampleOrder(product_id, is_premium);
  };

  return (
    <Fragment>
      <FlexContainer justifyContent="flex-start">
        <PageTitle>{t("dropshipping.live_products")}</PageTitle>
        <PulseIcon>
          <SVG icon={faCircleDot as SVGIcon} color="primary" size="lg" />
        </PulseIcon>
      </FlexContainer>
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
          {selected.length > 0 ? (
            <Fragment>
              <Button
                color="white"
                bgColor="primary"
                padding="12px 18px"
                onClick={() => setShowRestore(true)}
                alignSelf="center">
                <Trans
                  i18nKey="dropshipping.restore_bulk"
                  values={{ count: selected.length }}
                />
              </Button>
              <Button
                color="text"
                bgColor="white"
                padding="12px 18px"
                onClick={() => setShowDelete(true)}
                alignSelf="center">
                <Trans
                  i18nKey="dropshipping.delete_bulk"
                  values={{ count: selected.length }}
                />
              </Button>
            </Fragment>
          ) : null}
          <Filters
            label={t("dropshipping.filter")}
            filters={LiveProductsFilters}
            value={filters}
            onChange={setFilters}
          />
        </FlexContainer>
      </S.Header>
      <FilterTags
        tags={filters}
        onRemove={(value) => setFilters(filters.filter((elm) => elm !== value))}
      />
      <S.ProductsContainer>
        {products?.data?.map((product) => (
          <ProductCard
            product={product}
            key={product.id}
            onChangeSelected={handleSelect}
            selected={selected.includes(product)}
            deleteProduct={handleDeleteProduct}
            restoreProduct={handleRestore}
            addToImportList={handleAddToImportList}
            handleSampleOrder={orderSample}
            isLive
            loading={loading}
          />
        ))}
      </S.ProductsContainer>

      {isLoading || loading ? (
        <S.ProductsContainerSkeleton>
          <Skeleton
            count={8}
            containerClassName="skeleton-container"
            className="skeleton"
            inline
          />
        </S.ProductsContainerSkeleton>
      ) : null}

      {products?.data && products?.data?.length > 0 ? (
        <Pagination
          totalCount={totalCount}
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalPages={products?.total_pages as number}
          onPageChange={(page) => setPage(page as number)}
        />
      ) : null}

      {(products?.data?.length === 0 || (!products && !isLoading)) && (
        <EmptyState
          title={t("dropshipping.products_empty_state_title")}
          description={t("dropshipping.products_empty_state_desc")}
          icon={faBoxOpen as SVGIcon}
        />
      )}

      <DialogModal
        id="delete-live-product"
        isShowing={showDelete}
        icon={faCircleExclamation}
        hide={() => setShowDelete(!showDelete)}
        title={t("dropshipping.delete_product") + ` (${selected.length})`}
        description={t("dropshipping.delete_product_desc")}
        buttonText={t("dropshipping.delete")}
        buttonCancelText={t("dropshipping.cancel")}
        buttonColor="primary"
        handleAction={handleBulkDelete}
      />
      <DialogModal
        id="restore-product"
        isShowing={showRestore}
        icon={faCircleExclamationCheck}
        hide={() => setShowRestore(!showRestore)}
        title={t("dropshipping.restore_product") + ` (${selected.length})`}
        description={t("dropshipping.restore_product_desc")}
        buttonText={t("dropshipping.restore_modal")}
        buttonCancelText={t("dropshipping.cancel")}
        buttonColor="primary"
        handleAction={handleBulkUpdate}
      />
    </Fragment>
  );
};

export default LiveProductsPage;
