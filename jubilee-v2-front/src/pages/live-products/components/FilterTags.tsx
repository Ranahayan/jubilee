import Button from "~/components/ui/Button";
import { SVG } from "~/components/ui/SVG";
import { faXmark } from "@fortawesome/pro-light-svg-icons";
import { ImportListFilter } from "~/api/dropshipping/types";
import * as S from "./FilterTags.styles";
import { LiveProductsFilters } from "~/constants/filters";
import { useTranslation } from "react-i18next";

type Props = {
  tags: ImportListFilter[];
  onRemove: (value: string) => void;
};

export const FilterTags = ({ tags, onRemove }: Props) => {
  const { t } = useTranslation();
  return (
    <S.FilterTagContainer justifyContent="flex-start" flexWrap="wrap">
      {tags.map((tag, index) => {
        const matchingFilter = LiveProductsFilters.find(
          (filter) => filter.value === tag
        );
        const displayText = matchingFilter ? matchingFilter.labelKey : tag;
        return (
          <S.FilterTagContent key={index}>
            {t(displayText)}
            <Button
              alignSelf="center"
              color="secondary"
              onClick={() => onRemove(tag)}
              padding="0"
              style={{ margin: "2px 0 0 16px" }}
              bgColor="transparent">
              <SVG icon={faXmark} size="lg" />
            </Button>
          </S.FilterTagContent>
        );
      })}
    </S.FilterTagContainer>
  );
};
