import FlexContainer from "~/components/ui/FlexContainer";
import * as S from "./ProductCard.styles";
import { IProduct } from "~/types/dropshipping";
import { useMemo, useState } from "react";
import { t } from "i18next";
import { DialogModal } from "~/components/dialogModal";
import { IUnderlineTab } from "~/types/tabs";
import UnderlineTabs from "~/components/ui/Tabs/underlineTabs";
import { ProductTab } from "./ProductTab";
import { VariantTab } from "./VariantTab";
import Button from "~/components/ui/Button";
import { useRenderButtonText } from "~/hooks/useRenderButtonText";
import { useForm } from "~/hooks/useForm";
import { formConfig } from "./ProductTab.form";
import { ProductDescription } from "./ProductDescription";
import { ProductImages } from "./ProductImages";
import { useShopifyCollections } from "~/api/store/queries";
import { faCircleExclamation } from "@fortawesome/pro-regular-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import { faCrown } from "@fortawesome/pro-solid-svg-icons";
import { IProductVariantsPayload } from "~/api/dropshipping/types";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { AskAiButton } from "~/components/ui/AskAIButton";
import Separator from "~/components/ui/Separator";
import { SMARTLI_APPSTORE_URL } from "~/constants/urls";
import { PromoReviewsPro } from "~/components/PromoReviewsPro";

type Props = {
  product: IProduct;
  pushToStore: (product: IProduct) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (product: Partial<IProduct>) => void;
  handleBulkUpdateVariants: (payload: IProductVariantsPayload) => Promise<void>;
  loading?: boolean;
};

const tabsOptions = {
  PRODUCT: "dropshipping.product",
  DESCRIPTION: "dropshipping.description",
  VARIANTS: "dropshipping.variants",
  IMAGES: "dropshipping.images",
  REVIEWS: "dropshipping.reviews",
};

const tabsComponents = {
  [tabsOptions.PRODUCT]: ProductTab,
  [tabsOptions.DESCRIPTION]: ProductDescription,
  [tabsOptions.VARIANTS]: VariantTab,
  [tabsOptions.IMAGES]: ProductImages,
  [tabsOptions.REVIEWS]: PromoReviewsPro,
};

enum ActionType {
  PUSH = "PUSH",
  UPDATE = "UPDATE",
}

export const ProductCard = ({
  product,
  pushToStore,
  updateProduct,
  deleteProduct,
  handleBulkUpdateVariants,
  loading,
}: Props) => {
  const [currentTab, setCurrentTab] = useState(tabsOptions.PRODUCT);
  const [show, setShow] = useState(false);
  const [description, setDescription] = useState(product.description);
  const { data } = useShopifyCollections();
  const tabs = [
    { labelKey: tabsOptions.PRODUCT, isActive: false },
    { labelKey: tabsOptions.DESCRIPTION, isActive: false },
    { labelKey: tabsOptions.VARIANTS, isActive: false },
    { labelKey: tabsOptions.IMAGES, isActive: false },
    { labelKey: tabsOptions.REVIEWS, isActive: false, isNew: true },
  ];
  const productForm = useForm(formConfig);
  const isTablet = useMediaQuery("tablet");

  const tabsConfig = useMemo(() => {
    return tabs?.map((tab) => {
      tab.isActive = tab.labelKey === currentTab;
      return tab;
    });
  }, [currentTab]);

  const handleChangeTab = (tab: IUnderlineTab) => {
    setCurrentTab(tab.labelKey);
  };

  const renderButtonText = useRenderButtonText({
    isProcessed: product?.is_live,
    loading,
    actionText: t("dropshipping.push_to_store"),
    postActionText: t("dropshipping.pushed_to_store"),
  });

  const handleUpdateProduct = (type: ActionType) => {
    const { collections, tags, ...rest } = productForm.getValues();
    const collectionsPayload = (
      collections as { label: string; value: string }[]
    )?.map((c) => c.value);
    const payload = {
      id: product.id,
      description,
      tags: (tags ? tags : []) as string[],
      collections: ((data as { label: string; value: string }[]) ?? [])
        .filter(
          (col) =>
            col?.value && (collectionsPayload as string[])?.includes(col.value)
        )
        .map((col) => col.value),
      ...rest,
    };

    if (type === ActionType.PUSH) pushToStore(payload as IProduct);
    if (type === ActionType.UPDATE) updateProduct(payload as IProduct);
  };

  const TabComponent = tabsComponents[currentTab];

  return (
    <S.StyledContainer
      data-testid="import-list-card"
      padding="0px 0px 20px 0px"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      radius={0.6}
      width="100%">
      {product?.is_premium && (
        <S.PremiumBadge>
          <SVG icon={faCrown as SVGIcon} color="#FF7300" size="xs" />
          <S.PremiumBadgeText>{t("dropshipping.premium")}</S.PremiumBadgeText>
        </S.PremiumBadge>
      )}
      <S.StyledContainer
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="flex-start"
        width="100%">
        <UnderlineTabs
          padding="15px 0px 0px 0px"
          tabs={tabsConfig}
          onChange={handleChangeTab}>
          <FlexContainer
            flexDirection="column"
            alignItems="flex-start"
            padding={"0px"}
            width="100%">
            {TabComponent ? (
              <TabComponent
                handleBulkUpdateVariants={handleBulkUpdateVariants}
                form={productForm}
                product={product}
                onDescriptionChange={setDescription}
              />
            ) : null}
          </FlexContainer>
        </UnderlineTabs>
      </S.StyledContainer>

      <FlexContainer
        width="100%"
        justifyContent="space-between"
        flexDirection={isTablet ? "row" : "column"}>
        <S.RemoveButton
          color="black"
          radius={0.8}
          fontWeight={500}
          children={t("dropshipping.remove_product")}
          padding="13px 26px"
          isDisabled={!product.is_active}
          onClick={() => setShow(true)}
        />

        <FlexContainer
          justifyContent={isTablet ? "flex-end" : "space-between"}
          width="100%">
          <AskAiButton
            handleAction={() => {
              window.open(SMARTLI_APPSTORE_URL, "_blank");
            }}
          />

          <Separator type="vertical" padding={3} />

          <S.SaveButton
            color="primary"
            radius={0.8}
            fontWeight={600}
            children={t("dropshipping.save")}
            padding="13px 36px"
            isDisabled={!product.is_active}
            onClick={() => handleUpdateProduct(ActionType.UPDATE)}
          />
          <Button
            color="white"
            bgColor={product?.is_live ? "green" : "primary"}
            radius={0.8}
            fontWeight={600}
            children={renderButtonText()}
            padding="13px 36px"
            isDisabled={!product.is_active}
            onClick={() => handleUpdateProduct(ActionType.PUSH)}
          />
        </FlexContainer>
      </FlexContainer>

      <DialogModal
        id="delete-imported-product"
        isShowing={show}
        icon={faCircleExclamation}
        hide={() => setShow(!show)}
        title={t("dropshipping.remove_product")}
        buttonColor="primary"
        buttonText={t("dropshipping.remove")}
        buttonCancelText={t("dropshipping.cancel")}
        description={t("dropshipping.remove_product_desc")}
        handleAction={() => deleteProduct(product.id)}
      />
    </S.StyledContainer>
  );
};
