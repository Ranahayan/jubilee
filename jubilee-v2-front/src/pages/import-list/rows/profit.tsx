import { formatPrice } from "~/helpers/formatPrice";
import { TextStyled } from "./profit.styles";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  retailPriceCents: number;
  priceCents: number;
};

export const Profit = ({ retailPriceCents, priceCents }: Props) => {
  const { t } = useTranslation();
  const profit = useMemo(() => {
    return retailPriceCents - priceCents;
  }, [retailPriceCents, priceCents]);

  return (
    <TextStyled className={Math.sign(profit) === 1 ? t("dropshipping.positive") as string : t("dropshipping.negative") as string}>
      {formatPrice("USD", profit)}
    </TextStyled>
  );
};
