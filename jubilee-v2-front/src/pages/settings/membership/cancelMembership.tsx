import FlexContainer from "~/components/ui/FlexContainer";
//@ts-ignore
// import { ReactComponent as LeftImg } from "~/assets/svg/cancel-membership-illustration.svg";
import Star from "~/assets/svg/star.svg?react";
import { IPlan } from "~/types/billing";
import { faArrowRight } from "@fortawesome/pro-light-svg-icons";
import Text from "~/components/ui/Text";
import { SVG } from "~/components/ui/SVG";
import Button from "~/components/ui/Button";
import * as S from "./styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";

type Props = {
  currentPlan?: IPlan;
  hide: () => void;
  refreshAccount: () => void;
};

export const CancelMembership = ({ currentPlan, hide }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <FlexContainer gap={2.1}>
      {/* <LeftImg /> */}
      <FlexContainer gap={1.6} alignItems="stretch" flexDirection="column">
        <S.StyledText>{t("settings.benefits")}</S.StyledText>

        {currentPlan?.features.map((feat) => (
          <FlexContainer justifyContent="flex-start" gap={1.4} key={feat}>
            <Star />
            {/* @ts-ignore */}
            <Text dangerouslySetInnerHTML={{ __html: feat }} />
          </FlexContainer>
        ))}

        <Button onClick={hide} size="xl" color="white" bgColor="primary">
          {t("settings.keep")}
        </Button>

        <FlexContainer
          gap={0.8}
          /* @ts-ignore */
          onClick={() => navigate(paths.app.cancel)}>
          <S.ClickableText>{t("settings.still_cancel")}</S.ClickableText>
          <SVG icon={faArrowRight} />
        </FlexContainer>
      </FlexContainer>
    </FlexContainer>
  );
};
