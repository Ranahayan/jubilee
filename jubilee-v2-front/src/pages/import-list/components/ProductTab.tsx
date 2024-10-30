import FlexContainer from "~/components/ui/FlexContainer";
import * as S from "./ProductCard.styles";
import { IProduct } from "~/types/dropshipping";
import Slideshow from "~/components/ui/Slideshow";
import { Fragment, useEffect } from "react";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import _debounce from "lodash/debounce";
import { Form } from "~/components/ui/Form";
import { IFormHookProps } from "~/types/form";
import { useShopifyCollections } from "~/api/store/queries";

type Props = {
  product: IProduct;
  form: IFormHookProps;
};

export const ProductTab = ({ product, form }: Props) => {
  const isLaptopL = useMediaQuery("laptop");
  const slides = product?.assets?.map((asset) => ({ img: asset.image }));
  const { data: collections } = useShopifyCollections();

  useEffect(() => {
    if (product) {
      form.loadValues({
        title: product.title,
        tags: product.tags,
        category_name: product.category_name,
        collections: collections?.filter(
          (col: { label: string; value: string }) =>
            product?.collections?.includes(col.value)
        ),
      });
    }
  }, [product.id, collections]);

  return (
    <Fragment>
      <FlexContainer
        width="100%"
        padding={0}
        justifyContent="space-between"
        flexDirection={isLaptopL ? "row" : "column"}>
        <FlexContainer
          width={isLaptopL ? "50%" : "100%"}
          justifyContent="flex-start">
          <S.ImageContainer>
            <Slideshow
              autoplay={false}
              slides={slides}
              arrows={true}
              fitParent
              isFullHeight={false}
            />
          </S.ImageContainer>
        </FlexContainer>
        <FlexContainer
          flexDirection="column"
          alignItems="flex-start"
          width="100%"
          gap={2.5}>
          <Form {...form} />
        </FlexContainer>
      </FlexContainer>
    </Fragment>
  );
};
