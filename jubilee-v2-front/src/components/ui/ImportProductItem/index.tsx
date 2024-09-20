import { faCheckCircle, faPlus } from "@fortawesome/pro-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { IProductSync, ISyncPayload } from "~/types/productItem";
import { SVGIcon } from "../SVG/types";
import { SVG } from "../SVG";
import CustomCheckbox from "../Checkbox";
import FlexContainer from "../FlexContainer";
import Text from "../Text";

import * as S from "./styles";

type Props = {
  product: IProductSync;
  checked: boolean;
  onChange: () => void;
  handleSync: (selected: ISyncPayload) => Promise<void>;
};

export const ImportProductItem = ({
  product,
  onChange,
  checked,
  handleSync,
}: Props) => {
  const { t } = useTranslation();

  const sync = () => {
    handleSync({ ids: [product.id] });
  };

  return (
    <S.ItemContainer data-testid="import-product-item">
      <FlexContainer>
        {!product.synced ? (
          <CustomCheckbox checked={checked} onChange={onChange} />
        ) : null}

        <S.Image src={product.image_url} />
      </FlexContainer>

      <Text>{product.title}</Text>

      {product.synced ? (
        <S.Synced>
          <SVG icon={faCheckCircle as SVGIcon} color="green" />
          {t("product.imported")}
        </S.Synced>
      ) : (
        <S.ClickableFlex onClick={sync}>
          <SVG icon={faPlus as SVGIcon} color="primary" />
          {t("product.import")}
        </S.ClickableFlex>
      )}
    </S.ItemContainer>
  );
};
