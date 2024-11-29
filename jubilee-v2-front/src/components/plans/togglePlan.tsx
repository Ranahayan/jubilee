import { Trans, useTranslation } from "react-i18next";
import Toggle from "../ui/Toggle";
import * as S from "./plans.style";
import FlexContainer from "../ui/FlexContainer";

type Props = {
  isAnnual: boolean;
  toggleControl: () => void;
  biggestMonthsOff?: number;
};

export const TogglePlan = ({ isAnnual, toggleControl, biggestMonthsOff }: Props) => {
  const { t } = useTranslation();
  return (
    <FlexContainer
      alignItems="center"
      flexWrap="wrap"
      gap={1}
      data-testid="plan-cycle">
      <S.ToggleContentText className={`${!isAnnual ? "selected" : ""}`}>
        {t("settings.monthly")}
      </S.ToggleContentText>
      <Toggle onChange={toggleControl} value={isAnnual} />
      <S.ToggleContentText className={`${isAnnual ? "selected" : ""}`}>
        {t("settings.annual")}
      </S.ToggleContentText>
      <S.PromotionText>
        <Trans
          i18nKey="settings.up_to_months_off_plans"
          values={{ days: biggestMonthsOff }}
        />
      </S.PromotionText>
    </FlexContainer>
  );
};
