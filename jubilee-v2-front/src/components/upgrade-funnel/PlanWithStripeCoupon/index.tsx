import { IPlan } from "~/types/billing";
import * as S from "./styles";
import { Trans, useTranslation } from "react-i18next";
import { formatPercentage } from "~/helpers/numbers";
import { formatPrice } from "~/helpers/formatPrice";
import { isFeatureCrossedOff } from "~/components/plans/planCard";
import { SVG } from "~/components/ui/SVG";
import { faCheckCircle } from "@fortawesome/pro-solid-svg-icons";
import CountdownTimer from "~/components/ui/Countdown";
import { faArrowRight, faBolt } from "@fortawesome/pro-light-svg-icons";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import { StarsTop } from "./StarsTop";
import { StarsBottom } from "./StarsBottom";

interface Props {
  currentPlan: IPlan;
  targetPlan: IPlan;
  targetDate: Date;
  close: () => void;
}

export const PlanWithStripeCoupon = ({
  currentPlan,
  targetPlan,
  targetDate,
  close,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!targetPlan.stripe_upgrade_funnel_coupon) {
    return null;
  }

  const discountedPrice =
    targetPlan.cost_per_month *
    (1 - targetPlan.stripe_upgrade_funnel_coupon.percent_off / 100);

  return (
    <S.Content>
      <StarsTop />
      <StarsBottom />

      <S.Title>
        <Trans
          i18nKey="upgrade_funnel.discount_title"
          components={{
            1: <S.DiscountTitle />,
          }}
          values={{
            planName: targetPlan.name,
          }}
        />
      </S.Title>

      <S.Subtitle>
        {t("upgrade_funnel.discount_subtitle", {
          planName: targetPlan.name,
          percentOff: formatPercentage(
            targetPlan.stripe_upgrade_funnel_coupon.percent_off
          ),
          durationInMonths:
            targetPlan.stripe_upgrade_funnel_coupon.duration_in_months,
        })}
      </S.Subtitle>

      <S.PlanSummaryContainer>
        <S.PlanSummaryLine>
          <S.PlanBenefits>
            {t("upgrade_funnel.plan_benefits", { planName: targetPlan.name })}
          </S.PlanBenefits>

          <S.PlanPriceContainer>
            <S.PlanOriginalPrice>
              {formatPrice("USD", targetPlan.cost_per_month)}
            </S.PlanOriginalPrice>

            <div>
              <S.PlanDiscountedPrice>
                {formatPrice("USD", discountedPrice)}
              </S.PlanDiscountedPrice>
              <S.PerMonth>{t("upgrade_funnel.per_month")}</S.PerMonth>
            </div>
          </S.PlanPriceContainer>
        </S.PlanSummaryLine>

        <S.PlanSummaryLine>
          {targetPlan.features
            .filter((feature) => !isFeatureCrossedOff(feature))
            .map((feature) => (
              <S.PlanFeature key={feature}>
                <SVG icon={faCheckCircle} color="successDark" />
                <span dangerouslySetInnerHTML={{ __html: feature }} />
              </S.PlanFeature>
            ))}
        </S.PlanSummaryLine>
      </S.PlanSummaryContainer>

      <S.CountdownTimerContainer>
        <CountdownTimer
          targetDate={targetDate}
          bgColor="transparent"
          numberContainerWidth="100%"
          width="100%"
          height="70px"
          numberColor="white"
          textColor="white"
          numberSize="28px"
          textSize="16px"
          minutesKey="minutes"
          secondsKey="seconds"
          gap={2}
          dots={true}
          lineHeight={1}
          keysOutside
          borderColor="rgba(255, 255, 255, 0.12)"
          dotsColor="white"
          dotsHeight={1.6}
          callback={close}
        />
      </S.CountdownTimerContainer>

      <S.SwitchToPlan
        onClick={() => {
          navigate({
            pathname: paths.checkout.index,
            search: `?coupon=${targetPlan.stripe_upgrade_funnel_coupon_code}`,
          }, { state: { selectedPlanId: targetPlan.id } });
        }}>
        <SVG icon={faBolt} color="white" />
        {t("upgrade_funnel.switch_to", { planName: targetPlan.name })}
      </S.SwitchToPlan>

      <S.ContinueWithCurrentPlan onClick={close}>
        {t("upgrade_funnel.continue_with", { planName: currentPlan.name })}
        <SVG icon={faArrowRight} />
      </S.ContinueWithCurrentPlan>
    </S.Content>
  );
};
