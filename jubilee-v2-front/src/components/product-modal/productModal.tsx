import { faTruck, faClock } from "@fortawesome/pro-solid-svg-icons";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import Separator from "~/components/ui/Separator";
import Text from "~/components/ui/Text";
import {
  IProduct,
  IProductVariant,
  IShippingOption,
} from "~/types/dropshipping";
import _difference from "lodash/difference";
import * as S from "./styles";
import Carousel from "~/components/ui/Carousel";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useTranslation } from "react-i18next";
import { Fragment, useCallback, useMemo, useState } from "react";
import { formatPrice } from "~/helpers/formatPrice";
import VariantOption from "~/components/ui/Variant";
import { useRenderButtonText } from "../../hooks/useRenderButtonText";

type Props = {
  product: IProduct;
  addToImportList?: (product: IProduct) => void;
  loading?: boolean;
  handleSampleOrder?: (variant_id: number, is_premium?: boolean) => void;
};

export const ProductModal = ({
  product,
  addToImportList,
  loading,
  handleSampleOrder,
}: Props) => {
  const isLaptop = useMediaQuery("laptop");
  const { t } = useTranslation();
  const getOptions = (variant: IProductVariant) => {
    if (!variant?.selected_options) return [variant?.title];

    return variant?.selected_options?.map((option) => option.value);
  };

  const [variant, setVariant] = useState(product.variants[0]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    getOptions(product.variants[0])
  );
  const onlyTitleVariants = product?.variants?.filter(
    (variant) => variant?.selected_options?.length === 0
  );
  const profit = variant?.retail_price_cents - variant?.price_cents;
  const slides = product?.assets?.map((asset) => ({ img: asset?.image })) || [];
  const {
    title,
    supplier,
    description,
    country,
    is_imported,
    is_live,
    is_premium,
    shipping_fallback,
    shipping_options,
  } = product;
  const renderButtonText = useRenderButtonText({
    isProcessed: is_imported || is_live,
    loading,
    actionText: t("dropshipping.import_list"),
    postActionText: t("dropshipping.import_list_added"),
  });

  const getVariant = useCallback(
    (value: string, index: number) => {
      const options = [...selectedOptions];
      options[Math.min(index, selectedOptions.length)] = value;

      let variant = product?.variants?.find((variant) => {
        const values = variant?.selected_options?.map((option) => option.value);
        return _difference(options, values).length === 0;
      });

      if (!variant) {
        // If no variant is found, try to find a variant with the same value
        variant = product?.variants?.find((variant) => {
          const values = variant?.selected_options?.map(
            (option) => option.value
          );
          return values.includes(value);
        });
      }

      setSelectedOptions(getOptions(variant as IProductVariant));
      setVariant(variant as IProductVariant);
    },
    [product, selectedOptions]
  );

  const getVariantByTitle = useCallback(
    (title: string) => {
      const variant = product?.variants?.find(
        (variant) => variant?.title === title
      );
      setVariant(variant as IProductVariant);
      setSelectedOptions([]);
    },
    [product]
  );

  const validOptions = useMemo(() => {
    // Get all used options from all variants
    const allUsedOptions = (
      product?.variants?.map((variant) =>
        variant?.selected_options.map((option) => option.name)
      ) || []
    ).reduce((acc, curr) => acc.concat(curr), []);

    // Remove not used options from product options
    return (product?.options || [])
      .filter((elm) => allUsedOptions.includes(elm.name))
      .map((elm) => {
        // Get all used options values from all variants
        const allUsedOptionsValues = (
          product?.variants?.map((variant) =>
            variant?.selected_options.map((option) => option.value)
          ) || []
        ).reduce((acc, curr) => acc.concat(curr), []);
        // Remove not used options values from product options values
        elm.values = elm.values.filter((value) =>
          allUsedOptionsValues.includes(value)
        );
        return elm;
      });
  }, [product]);

  const minProcessingTime = shipping_options.reduce((acc, option) => {
    if (!acc) return option.shipping.processing_time;
    if (!option.shipping?.processing_time) return acc;

    if (option.shipping.processing_time < acc) {
      return option.shipping.processing_time;
    }

    return acc;
  }, shipping_fallback?.processing_time);

  return (
    <FlexContainer
      data-testid="product-modal-container"
      width="100%"
      alignItems={isLaptop ? "flex-start" : "center"}
      justifyContent="flex-start"
      flexDirection={isLaptop ? "row" : "column"}
      gap={5.2}>
      {slides.length > 0 && (
        <FlexContainer flexDirection="column" gap={3.0}>
          <Carousel slides={slides} />
        </FlexContainer>
      )}

      <FlexContainer
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="baseline"
        gap={2.0}>
        <FlexContainer flexDirection="column" alignItems="flex-start" gap={0.4}>
          <FlexContainer>
            <S.Title>{title}</S.Title>
            <S.StockInfo>
              {variant?.inventory_quantity} {t("dropshipping.in_stock")}
            </S.StockInfo>
          </FlexContainer>
          <Text secondary>
            {t("dropshipping.by")} <S.DecoratedText>{supplier}</S.DecoratedText>{" "}
            - {t("dropshipping.from")} {country}
          </Text>
        </FlexContainer>
        <Separator type="horizontal" />
        <FlexContainer justifyContent="flex-start" width="100%" gap={5.2}>
          <FlexContainer flexDirection="column" alignItems="flex-start">
            <Text secondary>{t("dropshipping.dropship_cost")}</Text>
            <S.StyledText primary>
              {formatPrice("USD", variant?.price_cents)}
            </S.StyledText>
          </FlexContainer>
          <S.FlexItem flexDirection="column" alignItems="flex-start">
            <Text secondary>{t("dropshipping.retail_price")}</Text>
            <S.StyledText>
              {formatPrice("USD", variant?.retail_price_cents)}
            </S.StyledText>
          </S.FlexItem>
          <FlexContainer flexDirection="column" alignItems="flex-start">
            <Text secondary>{t("dropshipping.profit")}</Text>
            <S.StyledText>{formatPrice("USD", profit)}</S.StyledText>
          </FlexContainer>
        </FlexContainer>
        {product?.variants?.length > 1 && (
          <Fragment>
            <Separator type="horizontal" />
            <FlexContainer
              flexDirection="column"
              data-testid="variant-container">
              {onlyTitleVariants.length > 0 ? (
                <VariantOption
                  name="Title"
                  values={onlyTitleVariants.map((variant) => variant.title)}
                  activeItem={[variant?.title]}
                  onClick={(title) => getVariantByTitle(title)}
                />
              ) : null}
              {validOptions.map((item, index) => (
                <VariantOption
                  key={item.name}
                  name={item.name}
                  values={item.values}
                  activeItem={selectedOptions}
                  onClick={(value) => getVariant(value as string, index)}
                />
              ))}
            </FlexContainer>
          </Fragment>
        )}
        <Separator type="horizontal" />

        {minProcessingTime ? (
          <S.ProcessingTimeContainer flexDirection="column">
            <FlexContainer justifyContent="flex-start">
              <SVG icon={faClock as SVGIcon} color="primary" />
              <S.StyledText>{t("dropshipping.processing_time")}</S.StyledText>
            </FlexContainer>
            <FlexContainer
              justifyContent="space-between"
              alignItems="flex-start">
              <FlexContainer flexDirection="column" alignItems="flex-start">
                <Text secondary>
                  {t("dropshipping.days", {
                    value: minProcessingTime,
                  })}
                </Text>
              </FlexContainer>
            </FlexContainer>
          </S.ProcessingTimeContainer>
        ) : null}

        <S.ShippingContainer flexDirection="column">
          <FlexContainer justifyContent="flex-start">
            <SVG icon={faTruck as SVGIcon} color="primary" />
            <S.StyledText>{t("dropshipping.shipping_time")}</S.StyledText>
          </FlexContainer>
          {shipping_options.map((option) => (
            <ShippingOption option={option} key={option.country} />
          ))}
          {shipping_fallback && (
            <ShippingOption
              option={{
                country: t("dropshipping.worldwide"),
                shipping: shipping_fallback,
              }}
            />
          )}
        </S.ShippingContainer>
        <FlexContainer width="100%">
          <FlexContainer width="40%">
            <Button
              color="text"
              outline
              width="100%"
              height="100%"
              padding="16px"
              radius={3.0}
              onClick={() => handleSampleOrder?.(variant?.id, is_premium)}>
              {loading
                ? t("dropshipping.loading")
                : t("dropshipping.order_sample")}
            </Button>
          </FlexContainer>
          <S.FlexItem>
            <Button
              bgColor={is_imported || is_live ? "green" : "primary"}
              color="white"
              isDisabled={is_imported || is_live}
              padding="16px"
              radius={3.0}
              width="100%"
              onClick={() => addToImportList?.(product)}>
              {renderButtonText()}
            </Button>
          </S.FlexItem>
        </FlexContainer>
        <Separator type="horizontal" />
        <FlexContainer flexDirection="column" alignItems="baseline">
          <S.ProductDescriptionTitle>
            {t("dropshipping.product_details")}
          </S.ProductDescriptionTitle>
          <S.ProductDescription
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </FlexContainer>
      </FlexContainer>
    </FlexContainer>
  );
};

const ShippingOption = ({
  option: { country, shipping },
}: {
  option: IShippingOption;
}) => {
  const { t } = useTranslation();

  return (
    <FlexContainer justifyContent="space-between" alignItems="flex-start">
      <FlexContainer flexDirection="column" alignItems="flex-start">
        <Text>{country}</Text>
        <Text secondary>
          {t("dropshipping.business_days", {
            value: shipping.delivery_time,
          })}
        </Text>
      </FlexContainer>
      <S.StyledText>
        {formatPrice("USD", shipping.base_price_cents)} /{" "}
        {formatPrice("USD", shipping.incremental_price_cents)}
      </S.StyledText>
    </FlexContainer>
  );
};
