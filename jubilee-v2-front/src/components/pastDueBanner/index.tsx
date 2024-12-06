import { faExclamationCircle } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "../ui/SVG";
import * as S from "./styles";
import FlexContainer from "../ui/FlexContainer";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";

export const PastDueBanner = () => {
  const { t } = useTranslation();
  const isLaptop = useMediaQuery("laptop");
  const navigate = useNavigate();

  return (
    <S.BannerContainer>
      <S.IconContainer>
        <SVG icon={faExclamationCircle} size="2xl" />
      </S.IconContainer>
      <FlexContainer
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        gap={0.4}>
        <S.BannerTitle>{t("past_due.title")}</S.BannerTitle>
        <S.BannerText>{t("past_due.desc")}</S.BannerText>
      </FlexContainer>
      <Button
        onClick={() => navigate(paths.settings.account)}
        width={isLaptop ? "auto" : "100%"}
        style={{ fontWeight: 600, marginLeft: "auto" }}
        alignSelf="center">
        {t("past_due.update_card")}
      </Button>
    </S.BannerContainer>
  );
};
