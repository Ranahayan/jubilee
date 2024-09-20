import { useTranslation } from "react-i18next";
import { faPen } from "@fortawesome/pro-solid-svg-icons";
import { faTrash } from "@fortawesome/pro-light-svg-icons";
import { IProduct } from "~/types/productItem";
import { SVGIcon } from "../SVG/types";
import { SVG } from "../SVG";
import Text from "../Text";
import Button from "~/components/ui/Button";
import LoaderSVG from "~/assets/svg/loader.svg?react";

import * as S from "./styles";
import FlexContainer from "../FlexContainer";
import { useState } from "react";

type Props = {
  product: IProduct;
  onRedirect: () => void;
  onDelete: () => void;
};

export const ProductItem = ({ product, onRedirect, onDelete }: Props) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const handleDelete = () => {
    const result: unknown = onDelete();
    if (result instanceof Promise) {
      setIsLoading(true);
      result.then(() => setIsRemoved(true)).finally(() => setIsLoading(false));
    }
  };

  if (isRemoved) return null;

  return (
    <S.ItemContainer data-testid="product-imported-item">
      <FlexContainer>
        <S.HideOnSmallDevice>
          <S.Image src={product.image_url_thumb || product.image_url} />
        </S.HideOnSmallDevice>
        <Text>{product.title}</Text>
      </FlexContainer>

      <FlexContainer>
        <S.TrashButton
          color="text"
          bgColor="white"
          onClick={handleDelete}
          isLoading={isLoading}>
          {isLoading ? (
            <LoaderSVG />
          ) : (
            <SVG icon={faTrash as SVGIcon} color="" />
          )}
        </S.TrashButton>

        <Button color="white" bgColor="primary" onClick={onRedirect}>
          <SVG icon={faPen as SVGIcon} color="white" />
          <S.HideOnSmallDevice>
            {t("product.generate_description")}
          </S.HideOnSmallDevice>
        </Button>
      </FlexContainer>
    </S.ItemContainer>
  );
};
