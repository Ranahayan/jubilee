import { IPlan, SubscriptionType } from "~/types/billing";
import * as S from "./PlanCardCheckout.styles";
import { centsToDecimal, getTotalPlanCost, splitNumber } from "~/helpers/numbers";
import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { paths } from "~/router/paths";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback } from "react";
import Separator from "~/components/ui/Separator";
import { isFeatureCrossedOff } from "~/components/plans/planCard";
import { IAccount } from "~/types/account";

type Props = {
  currentPlan?: IPlan;
  selectedPlan?: IPlan;
  plans?: IPlan[];
  account?: IAccount | null;
};

export const PlanCardCheckout = ({ currentPlan, selectedPlan, plans, account }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  if (!plans || !selectedPlan) return null;

  const isFirstTimeUser = !account?.has_subscribed_before;
  const isStripeFirstTime = isFirstTimeUser && account?.payment_provider === "stripe";

  const handlePlanClick = useCallback(
    (planId: string | undefined) => {
      if (planId) {
        searchParams.delete("promo_code_id");
        navigate({
          pathname: paths.checkout.index,
          search: searchParams.toString(),
        }, { state: { selectedPlanId: planId } });
      }
    },
    [navigate, searchParams]
  );

  const getPlanTotal = (plan: IPlan) => {
    if (isStripeFirstTime && plan.interval === SubscriptionType.MONTHLY) {
      return splitNumber(1);
    }
    return splitNumber(centsToDecimal(plan.cost_per_month));
  };

  const getOriginalPrice = (plan: IPlan) => {
    return splitNumber(centsToDecimal(plan.cost_per_month));
  };

  const renderPlanPriceByPlanType = (plan: IPlan): React.ReactNode => {
    if (plan.interval === SubscriptionType.MONTHLY) {
      if (isStripeFirstTime) {
        const originalPrice = getOriginalPrice(plan);
        const displayPrice = getPlanTotal(plan);
        return (
          <S.Prices>
            <S.OriginalPriceStrikethrough
              isHighlighted={plan.is_highlighted}
              isSelected={plan.id === selectedPlan.id}>
              ${originalPrice.integer}{originalPrice.decimal}
            </S.OriginalPriceStrikethrough>
            <S.CurrentPrice
              isHighlighted={plan.is_highlighted}
              isSelected={plan.id === selectedPlan.id}>
              ${displayPrice.integer}{displayPrice.decimal}
            </S.CurrentPrice>
          </S.Prices>
        );
      }
      
      return (
        <S.Prices>
          <S.CurrentPrice
            isHighlighted={plan.is_highlighted}
            isSelected={plan.id === selectedPlan.id}>
            ${getPlanTotal(plan).integer}{getPlanTotal(plan).decimal}
          </S.CurrentPrice>
        </S.Prices>
      );
    }

    // Annual: show full annual amount (same as total amount now), not per-month
    const annualTotal = splitNumber(getTotalPlanCost(plan));
    return (
      <>
        <S.Price
          isHighlighted={plan.is_highlighted}
          isSelected={plan.id === selectedPlan.id}>
          ${annualTotal.integer}
        </S.Price>
        <S.PriceSmall
          isHighlighted={plan.is_highlighted}
          isSelected={plan.id === selectedPlan.id}>
          {annualTotal.decimal}
        </S.PriceSmall>
      </>
    );
  }

  return (
    <S.PlansCardGrid plansCount={plans.length}>
      {plans.map((plan) => (
        <S.CardContainer
          isHighlighted={plan.is_highlighted}
          onClick={() => handlePlanClick(plan.id)}
          isSelected={plan.id === selectedPlan.id}
          isCurrentPlan={plan.id === currentPlan?.id}
          key={plan.id}>
          {plan.is_highlighted ? (
            <S.MostPopularTag>🔥 {t("settings.popular")}</S.MostPopularTag>
          ) : null}

          <S.InnerContainer isHighlighted={plan.is_highlighted}>
            <FlexContainer justifyContent="space-between">
              <FlexContainer gap={0.5}>
                <S.Radio type="radio" checked={plan.id === selectedPlan.id} />
                <S.Title>{plan.name}</S.Title>
              </FlexContainer>

              <span>
                { renderPlanPriceByPlanType(plan) }
              </span>
            </FlexContainer>

            <Separator type="horizontal" />

            <FlexContainer flexDirection="column" alignItems="flex-start">
              {plan.features
                .filter((feature) => !isFeatureCrossedOff(feature))
                .map((feature) => (
                  <FlexContainer key={feature} alignItems="flex-start">
                    <S.IconCheckContainer>
                      <SVG icon={faCheck} />
                    </S.IconCheckContainer>
                    <S.Feature dangerouslySetInnerHTML={{ __html: feature }} />
                  </FlexContainer>
                ))}
            </FlexContainer>
          </S.InnerContainer>
        </S.CardContainer>
      ))}
    </S.PlansCardGrid>
  );
};
