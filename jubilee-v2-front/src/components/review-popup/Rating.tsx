import { useTranslation } from "react-i18next";
import * as S from "./Rating.style";
import Rating1 from "~/assets/svg/ratings/1.svg?react";
import Rating2 from "~/assets/svg/ratings/2.svg?react";
import Rating3 from "~/assets/svg/ratings/3.svg?react";
import Rating4 from "~/assets/svg/ratings/4.svg?react";
import Rating5 from "~/assets/svg/ratings/5.svg?react";
import { useMemo } from "react";
import { ReviewValueType } from "./types";

type Props = {
  value: ReviewValueType;
  selectedValue: ReviewValueType | null;
  onSelect: (value: ReviewValueType | null) => void;
};

const getIcon = (value: ReviewValueType) => {
  switch (value) {
    case 1:
      return <Rating1 />;
    case 2:
      return <Rating2 />;
    case 3:
      return <Rating3 />;
    case 4:
      return <Rating4 />;
    case 5:
      return <Rating5 />;
  }
};

const Rating = ({ value, onSelect }: Props) => {
  const { t } = useTranslation();

  return (
    <S.RatingWrapper onClick={() => onSelect(value)}>
      <S.RatingIconWrapper>
        {getIcon(value)}
      </S.RatingIconWrapper>
      <S.Subtitle>
        {t("review_popup.rating_" + value)}
      </S.Subtitle>
    </S.RatingWrapper>
  );
};

export default Rating;
