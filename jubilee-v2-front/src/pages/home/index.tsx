import ReviewPopup from "~/components/review-popup";
import { ShowUpgradeModal } from "~/components/upgrade-funnel/showUpgradeModal";
import * as S from "./styles";
import { Brand, IProduct, IProductList } from "~/types/dropshipping";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useCreateSampleOrder,
  useDropshippingSettings,
  useGetCategories,
  useGetProducts,
} from "~/api/dropshipping/queries";
import { useLazyLoading } from "~/hooks/useLazyLoading";
import { faBoxOpen } from "@fortawesome/pro-solid-svg-icons";
import _debounce from "lodash/debounce";
import { t } from "i18next";
import { addToImportList } from "~/api/dropshipping/requests";
import {
  DROPSHIPPING_SETTINGS,
  IMPORT_LIST,
  ORDERS,
  PRODUCTS,
} from "~/api/dropshipping/types";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { Products } from "./components/products";
import { usePlanFeature } from "~/hooks/usePlanFeature";
import { Limits } from "~/types/billing";
import ColorPicker from "~/pages/home/components/ColorPicker";
import { useUpdateBackgroundColor } from "~/api/dropshipping/queries";

import {
  SIDEBAR_COUNT_IMPORTED_PRODUCTS,
  SIDEBAR_COUNT_SAMPLE_ORDERS,
} from "~/api/sidebarCounts/types";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useSearchParams } from "react-router-dom";
import { useBreadcrumbItems } from "~/hooks/useBreadcrumbItems";
import { SortByButton } from "./components/SortByButton";
import {
  getSortingOption,
  Sorting,
  SortingKey,
  sortingKeys,
} from "~/constants/product-sorting";
import { useAccount } from "~/hooks/useAccount";
import { ReactivateBanner } from "~/components/layout/ReactivateBanner";
import { ImageSearchModal } from "./components/ImageSearchModal";
import {
  faBox,
  faCamera,
  faChevronDown,
  faFillDrip,
  faFire,
} from "@fortawesome/pro-regular-svg-icons";
import { PlanStatus } from "~/types/account";
import useClickOutside from "~/hooks/useClickOutside";
import {
  triggerShowPlansModal,
  triggerShowResumeModal,
} from "~/helpers/customEvents";
import handleErrors from "~/helpers/handleErrors";
import Input from "~/components/ui/Input";
import { SVGIcon } from "~/components/ui/SVG/types";
import { SVG } from "~/components/ui/SVG";
import Separator from "~/components/ui/Separator";
import Categories from "~/components/ui/Categories";
import { EmptyState } from "~/components/ui/EmptyState";
import { PastDueBanner } from "~/components/pastDueBanner";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import Lottie from "react-lottie";
import animationData from "~/assets/lottie/brush.json"; 

const HomePage = () => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isDropshipBranded, setIsDropshipBranded] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const [showingImageSearchModal, setShowingImageSearchModal] = useState(false);
  const { account } = useAccount();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const categoryId =
    searchParams.get("categoryId") === null
      ? undefined
      : Number(searchParams.get("categoryId"));
  const isPlanDisabled = useMemo(() => {
    const isPlanInactive =
      account?.last_subscription?.status === PlanStatus.INACTIVE;
    return !account?.active_subscription && isPlanInactive;
  }, [account?.last_subscription?.status, account?.active_subscription]);

  const isPastDue = useMemo(() => {
    let pastDue = account?.last_subscription?.status === PlanStatus.PAST_DUE && !DISABLE_PAYMENTS

    if (!!account?.stripe_card_updated_at && !!account?.last_subscription) {
      const lastCardUpdateAt = new Date(account.stripe_card_updated_at);
      const subscriptionUpdatedAt = new Date(account?.last_subscription?.updated_at);
      pastDue = pastDue && lastCardUpdateAt < subscriptionUpdatedAt;
    }
    
    return pastDue;
  }, [account]);

  const searchImageId =
    searchParams.get("searchImageId") === null
      ? undefined
      : Number(searchParams.get("searchImageId"));

  const sorting = useMemo(
    () => getSortingOption((key) => searchParams.get(key)),
    [searchParams]
  );
  const [searchInput, setSearchInput] = useState(search);

  const updateSearchParam = (
    key: "categoryId" | "search" | "searchImageId" | SortingKey,
    value: string | number | null | undefined
  ) => {
    const params = new URLSearchParams(location.search);

    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    setSearchParams(params);
  };

  const updateSorting = (newSorting: Sorting) => {
    if (newSorting === null) {
      sortingKeys.forEach((key) => updateSearchParam(key, null));
      return;
    }

    const newKey = Object.keys(newSorting)[0] as SortingKey;

    sortingKeys.forEach((key) => {
      if (key === newKey) {
        updateSearchParam(key, newSorting[newKey]);
        return;
      }

      updateSearchParam(key, null);
    });
  };

  const handleChangeSearch = (newSearch: string) => {
    setSearchInput(newSearch);
    searchProducts(newSearch);
  };
  const clearSearch = () => {
    setSearchInput("");
    updateSearchParam("search", null);
  };

  const { data: categories } = useGetCategories();
  const { mutateAsync: createSampleOrder } = useCreateSampleOrder();
  const {
    data: products,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useGetProducts({
    is_premium: isPremium,
    branding_type: isDropshipBranded ? Brand.BRANDED : null,
    category: categoryId,
    search_term: search,
    search_image_id: searchImageId,
    ...sorting,
  });
  const lastElementRef = useLazyLoading({
    observer,
    isLoading,
    hasNextPage,
    fetchNextPage,
  });

  const searchProducts = useCallback(
    _debounce(
      (newSearch: string) => updateSearchParam("search", newSearch),
      500
    ),
    []
  );

  const queryClient = useQueryClient();
  const { data: settings } = useDropshippingSettings();
  const [backgroundColor, setBackgroundColor] = useState<string>("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const { mutateAsync: updateBackgroundColor } = useUpdateBackgroundColor();

  useEffect(() => {
    if (settings && settings?.products_background_color) {
      setBackgroundColor(settings.products_background_color);
    }
  }, [settings]);

  useClickOutside(colorPickerRef, () => {
    setShowColorPicker(false);
  });
  const { isFeatureDisabled, isFeaturePaused } = usePlanFeature();

  const { topLevelCategories, dropdownCategories } = useMemo(() => {
    const activeCategories = categories?.filter(
      (c) => c.parent === null && c.is_active
    );

    const topLevelCategories = activeCategories?.filter((c) => c.is_visible);
    const dropdownCategories = activeCategories?.filter((c) => !c.is_visible);

    return { topLevelCategories, dropdownCategories };
  }, [categories]);

  const markProductAsImported = async (id: string) => {
    const key = [
      ...PRODUCTS,
      {
        category: categoryId,
        search_term: search,
        is_premium: isPremium,
        branding_type: isDropshipBranded ? Brand.BRANDED : null,
      },
    ];
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
      return triggerShowPlansModal();
    }

    const { errors } = await handleErrors(
      () => addToImportList(product?.id),
      toastMessages
    );
    if (!errors) {
      queryClient.refetchQueries(IMPORT_LIST);
      queryClient.invalidateQueries(SIDEBAR_COUNT_IMPORTED_PRODUCTS);
      markProductAsImported(product?.id);
    }
  };

  const handleSampleOrder = async (variant_id: number) => {
    if (isFeaturePaused()) return triggerShowResumeModal();
    const payload = {
      variant_id,
      quantity: 1,
      additive: true,
    };

    const toastMessages = {
      loading: t("dropshipping.loading_sample_order"),
      success: t("dropshipping.success_sample_order"),
      error: t("dropshipping.error_sample_order"),
    };

    await handleErrors(() => createSampleOrder(payload), toastMessages);
    queryClient.refetchQueries(ORDERS);
    queryClient.refetchQueries(SIDEBAR_COUNT_SAMPLE_ORDERS);

    if (isFeatureDisabled(Limits.PAID_PLAN)) {
      return triggerShowPlansModal();
    }
  };

  const handleColor = (color: string) => {
    setBackgroundColor(color);
  };

  const handleSave = async () => {
    if (
      isFeatureDisabled(Limits.PAID_PLAN) ||
      isFeatureDisabled(Limits.CUSTOMIZED_BACKGROUND)
    ) {
      return triggerShowPlansModal();
    }

    const toastMessages = {
      loading: t("dropshipping.loading_update_color"),
      success: t("dropshipping.success_update_color"),
      error: t("dropshipping.error_update_color"),
    };

    await handleErrors(
      () => updateBackgroundColor(backgroundColor),
      toastMessages
    );

    setTimeout(() => {
      queryClient.refetchQueries(DROPSHIPPING_SETTINGS);
      setShowColorPicker(false);
    }, 100);
  };
  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const breadcrumbItems = useBreadcrumbItems({
    baseItems: [
      {
        translation: t("dropshipping.search_breadcrumb"),
        onClick:
          search || selectedCategory || searchImageId
            ? () => {
                updateSearchParam("categoryId", null);
                updateSearchParam("searchImageId", null);
                clearSearch();
              }
            : undefined,
      },
    ],
    searchParamItems: {
      search: {
        translation: (value) =>
          t("dropshipping.search_with_term", { term: value }),
      },
      categoryId: {
        translation: selectedCategory?.name ?? "",
        onClick: search ? () => clearSearch() : undefined,
      },
      searchImageId: {
        translation: t("dropshipping.image_you_uploaded"),
      },
    },
  });

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <Fragment>
      {isPastDue ? <PastDueBanner /> : null}
      {isPlanDisabled && !DISABLE_PAYMENTS ? (
        <ReactivateBanner account={account} />
      ) : null}
      <ReviewPopup />
      <S.FlexContainerRelative padding="20px 0">
        <Input
          type="string"
          onChange={(e) => handleChangeSearch(e.target.value)}
          value={searchInput}
          borderColor="transparent"
          placeholder={t("dropshipping.search") as string}
          style={{ height: "50px", padding: "13px 17px 13px 50px", borderRadius: "4px" }}
        />

        <S.AbsoluteIcon>
          <Lottie options={defaultOptions} height={300} width={300} />
        </S.AbsoluteIcon>

        <S.ImageSearchButton onClick={() => setShowingImageSearchModal(true)}>
          <SVG icon={faCamera} />
        </S.ImageSearchButton>
      </S.FlexContainerRelative>
      <Separator type="horizontal" />
      <Categories
        rows={2}
        columns={5}
        topLevelCategories={topLevelCategories ?? []}
        dropdownCategories={dropdownCategories}
        fillRow={t("dropshipping.skin_care") as string}
        onClick={(category) => updateSearchParam("categoryId", category.id)}
      />

      <S.FiltersContainer>
        <S.BooleanFilterButton
          active={isPremium}
          onClick={() => setIsPremium(!isPremium)}>
          <SVG icon={faFire} color="primary" />
          {t("dropshipping.premium")}
        </S.BooleanFilterButton>

        <S.BooleanFilterButton
          active={isDropshipBranded}
          onClick={() => setIsDropshipBranded(!isDropshipBranded)}>
          <SVG icon={faBox} color="primary" />
          {t("dropshipping.dropship_branded")}
        </S.BooleanFilterButton>
        <S.ColorwheelSelect
          ref={colorPickerRef}
          onClick={() => setShowColorPicker(!showColorPicker)}>
          <SVG icon={faFillDrip} color="primary" />
          {t("dropshipping.colorwheel")}
          <SVG icon={faChevronDown} size="sm" />
          <ColorPicker
            show={showColorPicker}
            color={backgroundColor}
            handleColor={handleColor}
            onSave={handleSave}
          />
        </S.ColorwheelSelect>

        <SortByButton sorting={sorting} updateSorting={updateSorting} />
      </S.FiltersContainer>
      <Separator type="horizontal" />

      {(!!selectedCategory || !!search || !!searchImageId) && (
        <S.StyledBreadcrumbs items={breadcrumbItems} />
      )}

      <S.ProductsContainer>
        <Products
          backgroundColor={backgroundColor}
          products={products as InfiniteData<IProductList>}
          lastElementRef={lastElementRef}
          handleAddToImportList={handleAddToImportList}
          loading={isLoading}
          handleSampleOrder={handleSampleOrder}
        />
      </S.ProductsContainer>
      {isLoading || isFetchingNextPage ? (
        <S.ProductsContainerSkeleton>
          <Skeleton
            count={8}
            containerClassName="skeleton-container"
            className="skeleton"
            inline
          />
        </S.ProductsContainerSkeleton>
      ) : null}
      {products && products?.pages?.[0]?.data?.length === 0 && !isLoading && (
        <EmptyState
          title={t("dropshipping.products_empty_state_title")}
          description={t("dropshipping.products_empty_state_desc")}
          icon={faBoxOpen as SVGIcon}
        />
      )}
      {/* <ShowUpgradeModal /> */}
      <ImageSearchModal
        isShowing={showingImageSearchModal}
        hide={() => setShowingImageSearchModal(false)}
        onSubmit={(file) => {
          updateSearchParam("searchImageId", file.id);
          setShowingImageSearchModal(false);
        }}
      />
    </Fragment>
  );
};

export default HomePage;
