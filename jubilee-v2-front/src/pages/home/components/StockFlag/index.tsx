import { faCheck, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import { IProduct } from "~/types/dropshipping";
import * as S from "./styles";

type Props = {
  product: IProduct;
};

export const StockFlag = ({ product }: Props) => {
  const { t } = useTranslation();
  const allOutOfStock = product?.variants?.every(
    (variant) => variant.inventory_quantity === 0
  );

  if (allOutOfStock) {
    return (
      <S.StockFlag className="out-of-stock">
        <SVG icon={faXmark as SVGIcon} color="red" />
        {t("dropshipping.out_of_stock")}
      </S.StockFlag>
    );
  }

  return (
    <S.StockFlag className="in-stock">
      <SVG icon={faCheck as SVGIcon} color="green" />
      {t("dropshipping.in_stock")}
    </S.StockFlag>
  );
};
