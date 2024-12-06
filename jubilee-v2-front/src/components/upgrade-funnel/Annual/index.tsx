import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import * as S from "./styles";
import { useTranslation } from "react-i18next";
import { SVG } from "~/components/ui/SVG";
import { faCheckCircle } from "@fortawesome/pro-regular-svg-icons";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { isFeatureCrossedOff } from "~/components/plans/planCard";

interface IAnnualPlan {
  features: string[];
  close: () => void;
}

export const AnnualPlan = ({ features, close }: IAnnualPlan) => {
  const { t } = useTranslation();

  return (
    <FlexContainer flexDirection="column" gap={3.2} padding="24px">
      <FlexContainer flexDirection="column" gap={0.8}>
        <S.IconContainer>
          <SVG icon={faCheckCircle} color="green" size="xl" />
        </S.IconContainer>

        <S.Title>{t("upgrade_funnel.congrats")}</S.Title>

        <S.Description>{t("upgrade_funnel.annual_description")}</S.Description>
      </FlexContainer>

      <S.FeaturesContainer>
        {features
          .filter((feature) => !isFeatureCrossedOff(feature))
          .map((feature) => (
            <FlexContainer
              key={feature}
              alignItems="flex-start"
              justifyContent="flex-start">
              <SVG icon={faCheck} color="green" size="sm" />
              <S.FeatureText dangerouslySetInnerHTML={{ __html: feature }} />
            </FlexContainer>
          ))}
      </S.FeaturesContainer>

      <Button
        long
        size="xl"
        bgColor="primary"
        color="white"
        width="100%"
        fontWeight={600}
        fontSize="16px"
        onClick={close}>
        {t("upgrade_funnel.continue")}
      </Button>
    </FlexContainer>
  );
};
