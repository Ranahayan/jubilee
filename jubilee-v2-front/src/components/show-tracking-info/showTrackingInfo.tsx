import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { faTruck } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "~/components/ui/SVG";
import * as S from "./styles";

type Props = {
  hide: () => void;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
};

export const ShowTrackingInfo = ({
  hide,
  trackingNumber,
  trackingUrl,
  carrier,
}: Props) => {
  const { t } = useTranslation();

  return (
    <S.Container>
      <S.Icon>
        <SVG icon={faTruck} size="lg" />
      </S.Icon>
      <S.Title>{t("orders.tracking-info")}</S.Title>

      <S.Label>{t("dropshipping.tracking")}</S.Label>
      <S.Text>{trackingNumber}</S.Text>

      {carrier && (
        <>
          <S.Label>{t("dropshipping.carrier")}</S.Label>
          <S.Text>{carrier}</S.Text>
        </>
      )}

      <S.Label>{t("dropshipping.track_package")}</S.Label>
      <S.Text><a target="_blank" href={trackingUrl}>{trackingUrl}</a></S.Text>

      <FlexContainer width="100%" justifyContent="flex-end">
        <S.BackButton
          color="text"
          padding="9px 29px"
          onClick={hide}
        >
          {t("common.close")}
        </S.BackButton>
      </FlexContainer>
    </S.Container>
  );
};
