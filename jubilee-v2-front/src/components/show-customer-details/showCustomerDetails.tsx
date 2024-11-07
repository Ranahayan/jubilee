import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { faUser } from "@fortawesome/pro-light-svg-icons";
import { SVG } from "~/components/ui/SVG";
import * as S from "./styles";

type Props = {
  hide: () => void;
  customer: string;
  phone?: string;
  address?: string;
};

export const ShowCustomerDetails = ({
  hide,
  customer,
  phone,
  address,
}: Props) => {
  const { t } = useTranslation();

  return (
    <S.Container>
      <S.Icon>
        <SVG icon={faUser} size="xl" />
      </S.Icon>
      <S.Title>{t("orders.customer-info")}</S.Title>

      <S.Label>{t("orders.name")}</S.Label>
      <S.Text>{customer}</S.Text>

      {phone && (
        <>
          <S.Label>{t("orders.phone")}</S.Label>
          <S.Text>{phone}</S.Text>
        </>
      )}

      <S.Label>{t("orders.address")}</S.Label>
      <S.Text>{address}</S.Text>

      <FlexContainer width="100%" justifyContent="flex-end">
        <S.BackButton color="text" padding="9px 29px" onClick={hide}>
          {t("common.close")}
        </S.BackButton>
      </FlexContainer>
    </S.Container>
  );
};
