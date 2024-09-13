import { Trans, useTranslation } from "react-i18next";
import * as S from "./ReactivateBanner.style";
import { SVG } from "../ui/SVG";
import { faCheck, faDown, faRight } from "@fortawesome/pro-solid-svg-icons";
import FlexContainer from "../ui/FlexContainer";
import Text from "../ui/Text";
import Button from "../ui/Button";
import { planEmojis } from "~/constants/features";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { IAccount } from "~/types/account";
import { isFeatureCrossedOff } from "../plans/planCard";

type ReactivateBannerProps = {
  account: IAccount | null;
};

export const ReactivateBanner = ({ account }: ReactivateBannerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLaptop = useMediaQuery("laptop");
  const plan = account?.last_subscription?.plan;
  const emoji = useMemo(() => {
    if (!plan?.name) return planEmojis["starter"];
    const lowerCasePlanName = plan?.name?.toLowerCase();
    return planEmojis[lowerCasePlanName];
  }, [plan?.name]);

  return (
    <S.ReactivateBannerContainer>
      <S.ReactivateMessage>
        <S.MessageText>
          <Trans
            i18nKey="reactivate.message"
            components={{ b: <S.BoldText /> }}
          />
        </S.MessageText>
        <S.IconCircle>
          <SVG icon={isLaptop ? faRight : faDown} />
        </S.IconCircle>
      </S.ReactivateMessage>
      <S.PaddingFlexContainer
        alignItems="flex-start"
        gap={isLaptop ? "0px" : "10px"}
        flexDirection={isLaptop ? "row" : "column"}
        width={isLaptop ? "70%" : "100%"}
        justifyContent="flex-start">
        <S.EmojiContainer>
          <S.Emoji>{emoji}</S.Emoji>
        </S.EmojiContainer>

        <S.ReactivatePlanInfo>
          <FlexContainer
            alignItems="flex-start"
            justifyContent="flex-start"
            gap="6px"
            flexDirection="column">
            <S.PlanTitle>
              <Trans
                i18nKey="reactivate.reactivate_title"
                components={{ 1: <S.PrimaryBold /> }}
                values={{ planName: plan?.name }}
              />
            </S.PlanTitle>
            <S.PlanCTA>{t("reactivate.reactivate_cta")}</S.PlanCTA>
          </FlexContainer>
          <FlexContainer
            width="100%"
            flexWrap="wrap"
            gap="0px"
            alignItems="flex-start"
            justifyContent="flex-start">
            {plan?.features
              ?.filter((feature) => !isFeatureCrossedOff(feature))
              ?.slice(0, 4)
              .map((feature) => (
                <S.TextFlex>
                  <S.IconCheckContainer key={feature}>
                    <SVG icon={faCheck} />
                  </S.IconCheckContainer>
                  <Text dangerouslySetInnerHTML={{ __html: feature }} />
                </S.TextFlex>
              ))}
          </FlexContainer>
          <Button
            color="white"
            bgColor="green"
            padding="10px"
            onClick={() =>
              navigate({
                pathname: paths.checkout.index,
              }, { state: { selectedPlanId: plan?.id || "" } })
            }
            style={{ fontSize: "12px", fontWeight: 600 }}>
            {t("reactivate.now")}
          </Button>
        </S.ReactivatePlanInfo>
      </S.PaddingFlexContainer>
    </S.ReactivateBannerContainer>
  );
};
