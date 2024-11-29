import * as S from "./planCard.style";
import Button from "~/components/ui/Button";
import Separator from "~/components/ui/Separator";
import { SVG } from "~/components/ui/SVG";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { Trans, useTranslation } from "react-i18next";
import { IPlan, SubscriptionType } from "~/types/billing";
import {
  centsToDecimal,
  getTotalPlanCost,
  splitNumber,
} from "~/helpers/numbers";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { triggerShowResumeModal } from "~/helpers/customEvents";
import { IAccount } from "~/types/account";
import { useQueryClient } from "@tanstack/react-query";
import { PRORATION } from "~/api/billing/types";

type Props = {
  plan?: IPlan;
  isHighestPrice: boolean;
  account: IAccount | null;
  previousPlanName: string | null;
  closeModal?: () => void;
  handleClick?: (plan: IPlan) => void;
};

export const isFeatureCrossedOff = (feature: string) => {
  return feature.includes("<s>") && feature.includes("</s>");
};

const PlanCard = ({
  plan,
  account,
  closeModal,
  isHighestPrice,
  previousPlanName,
  handleClick = undefined
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAnnual = plan?.interval === SubscriptionType.ANNUAL;
  const bgColor = plan?.is_highlighted ? "primary" : "transparent";
  const textColor = plan?.is_highlighted ? "white" : "primary";
  const isSubscribed = plan?.id === account?.active_subscription?.plan?.id;
  const trialDays = plan?.trial_days;
  const buttonText = useMemo(() => {
    if (isSubscribed && account?.active_subscription?.paused_at)
      return t("settings.paused");

    if (isSubscribed) return t("settings.current");
    if (trialDays) return t("settings.try_for_free");
    if (isAnnual || account?.has_subscribed_before) return t("settings.start");

    return t("settings.start");
  }, [isAnnual, isSubscribed, account?.active_subscription?.plan]);

  const handleRedirect = () => {
    if (account?.active_subscription?.paused_at)
      return triggerShowResumeModal();
    localStorage.setItem("plansModal", "false");
    localStorage.setItem("selectedPlanHistory", JSON.stringify([]))
    navigate("/checkout", { state: { selectedPlanId: plan?.id } });
    queryClient.invalidateQueries(PRORATION);
    closeModal && closeModal();
  };

  const splitedTotal = splitNumber(
    centsToDecimal(plan?.cost_per_month as number).toFixed(2)
  );

  return (
    <S.PlanCardContainer
      primary={plan?.is_highlighted || false}
      data-testid="plan-card">
      {plan?.is_highlighted ? (
        <S.PlanCardPromotion>
          <span>{t("settings.recommended_plan")}</span>
        </S.PlanCardPromotion>
      ) : null}

      {!plan?.is_highlighted && Boolean(plan?.months_off) && (
        <S.MonthsOffContainer>
          <span>{t("settings.months_off", { days: plan?.months_off })}</span>
        </S.MonthsOffContainer>
      )}

      <S.HeaderContainer>
        <S.Header>
          <S.PlanCardTitle>{plan?.name}</S.PlanCardTitle>

          <S.PlanCardPrice>
            {plan?.old_cost_per_month ? (
              <S.DiscountText>
                ${centsToDecimal(plan?.old_cost_per_month)}
              </S.DiscountText>
            ) : null}
            <Trans
              i18nKey="settings.mon"
              components={{
                1: <S.MonthlyValue />,
                2: <S.DecimalValue />,
              }}
              values={{
                integer: splitedTotal.integer,
                decimal: splitedTotal.decimal,
              }}
            />
          </S.PlanCardPrice>

          <S.PlanCardSubtitle isAnnual={isAnnual}>
            {isAnnual
              ? t("settings.billed_annually", {
                amount: `$${getTotalPlanCost(plan)}`,
              })
              : plan?.trial_days
                ? t("settings.trial", { trial_days: plan.trial_days })
                : ""}
          </S.PlanCardSubtitle>
        </S.Header>
      </S.HeaderContainer>

      <Separator type="horizontal" className="separator" />

      <S.ButtonContainer>
        <Button
          size="xl"
          bgColor={bgColor}
          color={textColor}
          fontWeight={plan?.is_highlighted ? 600 : 500}
          isDisabled={!!isSubscribed}
          onClick={handleClick ? () => handleClick(plan as IPlan) : handleRedirect}>
          {buttonText}
        </Button>
      </S.ButtonContainer>

      <S.PlanCardList data-testid="plan-features">
        <S.EverythingPlusText>
          {previousPlanName
            ? t("settings.everything_plus", { planName: previousPlanName })
            : t("settings.what_you_get")}
        </S.EverythingPlusText>

        {plan?.features.map((feature: string, i: number) => (
          <S.PlanCardItem
            key={`${feature}-${i}`}
            disabled={isFeatureCrossedOff(feature)}>
            <S.PlanCardItemIconContainer>
              <SVG icon={faCheck} color="green" />
            </S.PlanCardItemIconContainer>
            <S.FeatureText dangerouslySetInnerHTML={{ __html: feature }} />
          </S.PlanCardItem>
        ))}
      </S.PlanCardList>
    </S.PlanCardContainer>
  );
};

export default PlanCard;
