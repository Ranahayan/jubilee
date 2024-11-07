import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { faCircleExclamation } from "@fortawesome/pro-regular-svg-icons";
import { SVG } from "~/components/ui/SVG";
import * as S from "./styles";
import Button from "~/components/ui/Button";

type Props = {
  hide: () => void;
  onConfirm: () => void;
};

export const ConfirmCancelOrder = ({
  hide,
  onConfirm
}: Props) => {
  const { t } = useTranslation();

  return (
    <S.Container>
      <S.Icon>
        <SVG icon={faCircleExclamation} size="lg" />
      </S.Icon>
      <S.Title>{t("orders.cancel-order")}</S.Title>

      <S.TextSecondary>{t("orders.cancel-order-desc")}</S.TextSecondary>

      <FlexContainer width="100%" justifyContent="flex-end">
        <S.BackButton
          color="text"
          padding="9px 29px"
          onClick={hide}
        >
          {t("orders.cancel")}
        </S.BackButton>

        <Button
          color="white"
          bgColor="primary"
          padding="9px 29px"
          width="100%"
          onClick={onConfirm}
        >
          {t("orders.cancel-order")}
        </Button>
      </FlexContainer>
    </S.Container>
  );
};
