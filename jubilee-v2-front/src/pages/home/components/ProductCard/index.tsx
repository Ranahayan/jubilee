import * as S from "./styles";
import { faCartPlus } from "@fortawesome/pro-light-svg-icons";
import { useTranslation } from "react-i18next";
import Modal from "~/components/ui/Modal";
import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { ProductModal } from "~/components/product-modal/productModal";
import { IProduct } from "~/types/dropshipping";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { formatPrice } from "~/helpers/formatPrice";
import {
  faCircleExclamation,
  faTrashAlt,
} from "@fortawesome/pro-regular-svg-icons";
import { useRenderButtonText } from "~/hooks/useRenderButtonText";
import { faCrown } from "@fortawesome/pro-solid-svg-icons";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import Text from "~/components/ui/Text";
import { SVGIcon } from "~/components/ui/SVG/types";
import Slideshow from "~/components/ui/Slideshow";
import Button from "~/components/ui/Button";
import CustomCheckbox from "~/components/ui/Checkbox";
import { DialogModal } from "~/components/dialogModal";
import { StockFlag } from "../StockFlag";

type Props = {
  product: IProduct;
  addToImportList?: (product: IProduct) => void;
  isLive?: boolean;
  deleteProduct?: (id: string) => void;
  restoreProduct?: (id: string, description: string) => void;
  loading?: boolean;
  handleSampleOrder?:
    | (() => void)
    | ((product_id: number, is_premium: boolean) => Promise<void>);
  selected?: boolean;
  onChangeSelected?: (product: IProduct) => void;
  backgroundColor?: string;
};

const ProductCard = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      product,
      addToImportList,
      isLive = false,
      deleteProduct,
      restoreProduct,
      loading,
      handleSampleOrder,
      selected,
      onChangeSelected,
      backgroundColor,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const isLaptop = useMediaQuery("laptop");
    const [modalToShow, setModalToShow] = useState<
      "product" | "delete" | "restore" | null
    >(null);
    const slides =
      product?.assets?.map((asset) => ({ img: asset.image })) || [];
    const handleImageClick = () =>
      slides.length === 0 ? setModalToShow("product") : null;

    const productTags = useMemo(() => {
      const tags = []
      const variant = product?.variants?.[0];
  
      if (product.branding_type !== "unbranded") {
        tags.push(t("dropshipping.dropship_branded"));
      }
      if (product.moq_quantity > 1) {
        tags.push(t("dropshipping.moq"));
      }
  
      return tags
    }, [product]);

    return (
      <S.ProductCardContainer ref={ref} data-testid="product-card">
        <StockFlag product={product} />
        <S.ImageContainer backgroundColor={backgroundColor} onClick={() => (isLive ? null : handleImageClick())}>
          {onChangeSelected ? (
            <S.CheckboxContainer>
              <CustomCheckbox
                checked={selected}
                onChange={() => onChangeSelected?.(product)}
              />
            </S.CheckboxContainer>
          ) : null}
          <Slideshow
            autoplay={false}
            slides={slides}
            arrows={true}
            fitParent
            onClick={() => (isLive ? null : setModalToShow("product"))}
            isFullHeight={false}
          />
        </S.ImageContainer>
        {isLive ? (
          <ProductLive
            product={product}
            setModalToShow={setModalToShow}
            loading={loading}
            showModal={() => setModalToShow("product")}
          />
        ) : (
          <ProductInfo
            tags={productTags}
            product={product}
            addToImportList={addToImportList}
            loading={loading}
            handleSampleOrder={handleSampleOrder as () => void}
          />
        )}
        <Modal
          id="product-details"
          isShowing={modalToShow === "product"}
          hide={() => setModalToShow(null)}
          minWidth={isLaptop ? "30%" : "95%"}>
          <ProductModal
            product={product}
            addToImportList={addToImportList}
            handleSampleOrder={handleSampleOrder as () => void}
          />
        </Modal>
        <DialogModal
          id="delete-live-product"
          isShowing={modalToShow === "delete"}
          icon={faCircleExclamation}
          hide={() => setModalToShow(null)}
          title={t("dropshipping.delete_product")}
          description={t("dropshipping.delete_product_desc")}
          buttonText={t("dropshipping.delete")}
          buttonCancelText={t("dropshipping.cancel")}
          buttonColor="primary"
          handleAction={() => deleteProduct?.(product.id)}
        />
        <DialogModal
          id="restore-product"
          isShowing={modalToShow === "restore"}
          icon={faCircleExclamation}
          hide={() => setModalToShow(null)}
          title={t("dropshipping.restore_product")}
          description={t("dropshipping.restore_product_desc")}
          buttonText={t("dropshipping.restore_modal")}
          buttonCancelText={t("dropshipping.cancel")}
          buttonColor="primary"
          handleAction={() => restoreProduct?.(product.id, product.description)}
        />
      </S.ProductCardContainer>
    );
  }
);

type ProductLiveProps = {
  product: IProduct;
  setModalToShow: Dispatch<
    SetStateAction<"product" | "delete" | "restore" | null>
  >;
  showModal?: () => void;
  loading?: boolean;
};

const ProductLive = ({
  product,
  loading,
  showModal,
  setModalToShow,
}: ProductLiveProps) => {
  const { t } = useTranslation();

  return (
    <S.FlexContainerRelative
      flexDirection="column"
      alignItems="flex-start"
      padding="18px">
      {product?.is_premium && (
        <S.PremiumBadge>
          <SVG icon={faCrown as SVGIcon} color="primary" size="xs" />
          <S.PremiumBadgeText>{t("dropshipping.premium")}</S.PremiumBadgeText>
        </S.PremiumBadge>
      )}
      <FlexContainer flexDirection="column" alignItems="flex-start" gap={0.5}>
        <S.StyledTitle>{product.title}</S.StyledTitle>
        <FlexContainer width="100%" justifyContent="space-between">
          <S.SupplierText>
            {t("dropshipping.by")} {product?.supplier}
          </S.SupplierText>
          <S.ViewProductButton onClick={showModal}>
            {t("dropshipping.view_product")}
          </S.ViewProductButton>
        </FlexContainer>
      </FlexContainer>
      <Button
        children={t("dropshipping.view_on_store")}
        color="white"
        bgColor="primary"
        radius="6px"
        width="100%"
        onClick={() => window.open(product.shopify_product_link, "_blank")}
      />
      <FlexContainer width="100%">
        <Button
          children={
            loading ? t("dropshipping.loading") : t("dropshipping.restore")
          }
          color="text"
          bgColor="borderSecondary"
          radius="6px"
          width="100%"
          onClick={() => setModalToShow("restore")}
        />
        <S.StyledIcon onClick={() => setModalToShow("delete")}>
          <SVG icon={faTrashAlt as SVGIcon} />
        </S.StyledIcon>
      </FlexContainer>
    </S.FlexContainerRelative>
  );
};

type ProductInfoProps = {
  product: IProduct;
  addToImportList?: (product: IProduct) => void;
  loading?: boolean;
  handleSampleOrder?: () => void;
  tags?: string[];
};

const ProductInfo = ({ product, addToImportList, loading, handleSampleOrder, tags }: ProductInfoProps) => {
  const { t } = useTranslation();
  const profit =
    product?.variants?.[0]?.retail_price_cents -
    product?.variants?.[0]?.price_cents;
  const renderButtonText = useRenderButtonText({
    isProcessed: product?.is_imported,
    loading,
    actionText: t("dropshipping.import_list"),
    postActionText: t("dropshipping.import_list_added"),
  });

  return (
    <S.StyledFlexContainer className="styled-flex-container">
      <S.Tags>{tags ? tags.map((tag) => <S.StyledTag key={tag}>{tag}</S.StyledTag>) : null}</S.Tags>
      {product?.is_premium && (
        <S.PremiumBadge>
          <SVG icon={faCrown as SVGIcon} color="primary" size="xs" />
          <S.PremiumBadgeText>{t("dropshipping.premium")}</S.PremiumBadgeText>
        </S.PremiumBadge>
      )}
      <S.StyledTitle data-testid="product-title">{product.title}</S.StyledTitle>
      <FlexContainer justifyContent="space-between" width="100%">
        <FlexContainer flexDirection="column" alignItems="baseline">
          <FlexContainer>
            <Text>{t("dropshipping.dropship_cost")}: </Text>
            <S.StyledText data-testid="dropship-price">
              {formatPrice("USD", product?.variants?.[0]?.price_cents)}
            </S.StyledText>
          </FlexContainer>

          <FlexContainer>
            <Text>{t("dropshipping.retail_price")}: </Text>
            <S.StyledText data-testid="retail-price">
              {formatPrice("USD", product?.variants?.[0]?.retail_price_cents)}
            </S.StyledText>
          </FlexContainer>
        </FlexContainer>

        <FlexContainer flexDirection="column" alignItems="flex-end">
          <Text>{t("dropshipping.profit")}</Text>
          <Text secondary data-testid="profit">
            {formatPrice("USD", profit)}
          </Text>
        </FlexContainer>
      </FlexContainer>
      <S.HoveredContainer className="hovered-container">
        <S.StyledIcon onClick={handleSampleOrder}>
          <SVG icon={faCartPlus as SVGIcon} />
        </S.StyledIcon>

        <Button
          children={renderButtonText()}
          color="white"
          bgColor={product?.is_imported ? "green" : "primary"}
          isDisabled={product?.is_imported}
          radius="5.4"
          alignSelf="center"
          onClick={() => addToImportList?.(product)}
        />
      </S.HoveredContainer>
    </S.StyledFlexContainer>
  );
};

export default ProductCard;
