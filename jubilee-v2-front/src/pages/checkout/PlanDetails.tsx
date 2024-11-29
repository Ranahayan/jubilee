import { useCallback, useEffect, useMemo, useState } from "react";
import { centsToDecimal, formatCurrency } from "~/helpers/numbers";
import { IPlan, SubscriptionType } from "~/types/billing";
import { useTranslation } from "react-i18next";
import CardsCheckout from "~/assets/svg/cards-checkout.svg";
import FlexContainer from "~/components/ui/FlexContainer";
import Container from "~/components/ui/Container";
import { useAccount } from "~/hooks/useAccount";

import "react-loading-skeleton/dist/skeleton.css";
import { TogglePlan } from "~/components/plans/togglePlan";
import { PlanCardCheckout } from "./PlanCardCheckout";
import { usePlans } from "~/api/billing/queries";
import { PlanStatus } from "~/types/account";
import * as S from "./styles";
import { SVG } from "~/components/ui/SVG";
import { faLock } from "@fortawesome/pro-solid-svg-icons";
import Separator from "~/components/ui/Separator";
import { CouponInput } from "./CouponInput";
import {
  useNavigate,
  useNavigationType,
  useSearchParams,
} from "react-router-dom";
import { paths } from "~/router/paths";
import { faAngleLeft } from "@fortawesome/pro-regular-svg-icons";
import Button from "~/components/ui/Button";
import CustomCheckbox from "~/components/ui/Checkbox";

type Props = {
  plan?: IPlan;
  getPlan: (name: string | undefined, interval: string, forWinning: boolean | undefined) => IPlan | undefined;
  isShopifyPayment: boolean;
  hideMonthlyRadio: boolean;
};

const PlanDetails = ({
  plan,
  getPlan,
  hideMonthlyRadio,
  isShopifyPayment,
}: Props) => {
  const { t } = useTranslation();
  const { account } = useAccount();
  const { data: plans } = usePlans();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [checkedForWinning, setCheckedForWinning] = useState(true);

  const annualQueryParam = searchParams.get("annual");
  const [isAnnual, setIsAnnual] = useState(() => {
    if (annualQueryParam === "true") return true;
    return plan?.interval === SubscriptionType.ANNUAL;
  });

  // Remember last selected plan per tab so switching back restores it (e.g. Starter monthly → annual → back to Starter monthly)
  const [lastMonthlyPlanId, setLastMonthlyPlanId] = useState<string | null>(null);
  const [lastAnnualPlanId, setLastAnnualPlanId] = useState<string | null>(null);

  const isCurrentPlanAnnual =
    account?.active_subscription?.plan?.interval === SubscriptionType.ANNUAL;

  const activePlans = useMemo(() => {
    return plans?.filter((plan) => plan.status === PlanStatus.ACTIVE);
  }, [plans]);

  useEffect(() => {
    if (!plan?.id) return;
    if (plan.interval === SubscriptionType.MONTHLY) {
      setLastMonthlyPlanId(plan.id);
    } else {
      setLastAnnualPlanId(plan.id);
    }
  }, [plan?.id, plan?.interval]);

  const currentMonthlyPlan = useMemo(
    () => {
      return getPlan(plan?.name, SubscriptionType.MONTHLY, checkedForWinning);
    },
    [plan]
  );

  const currentAnnualPlan = useMemo(
    () => getPlan(plan?.name, SubscriptionType.ANNUAL, false) || null,
    [plan]
  );

  const toggleControl = useCallback(() => {
    setIsAnnual(!isAnnual);
    if (plan?.interval === SubscriptionType.ANNUAL) {
      // Switching to monthly: 1) same plan name, 2) last monthly selection, 3) Empire
      const monthlyPlans =
        activePlans?.filter(
          (p) =>
            p.interval === SubscriptionType.MONTHLY &&
            p.for_winning === checkedForWinning
        ) ?? [];
      const lastMonthlyPlan = lastMonthlyPlanId
        ? monthlyPlans.find((p) => p.id === lastMonthlyPlanId)
        : null;
      const planToSelect =
        currentMonthlyPlan ??
        lastMonthlyPlan ??
        getPlan("Empire", SubscriptionType.MONTHLY, checkedForWinning);
      navigate(
        {
          pathname: paths.checkout.index,
          search: searchParams.toString(),
        },
        { state: { selectedPlanId: planToSelect?.id as string } }
      );
    } else {
      if (plan?.name === "Starter") {
        // No Starter in annual → preselect Empire
        const empireAnnualPlan = getPlan("Empire", SubscriptionType.ANNUAL, false);
        navigate({
          pathname: paths.checkout.index,
        }, { state: { selectedPlanId: empireAnnualPlan?.id as string } });
      } else {
        // Switching to annual: 1) same plan name, 2) last annual selection, 3) Empire
        const annualPlans =
          activePlans?.filter(
            (p) => p.interval === SubscriptionType.ANNUAL
          ) ?? [];
        const lastAnnualPlan = lastAnnualPlanId
          ? annualPlans.find((p) => p.id === lastAnnualPlanId)
          : null;
        const empireAnnualPlan = getPlan("Empire", SubscriptionType.ANNUAL, false);
        const planToSelect =
          currentAnnualPlan ?? lastAnnualPlan ?? empireAnnualPlan;
        navigate({
          pathname: paths.checkout.index,
          search: searchParams.toString(),
        }, { state: { selectedPlanId: planToSelect?.id as string } });
      }
    }
  }, [
    searchParams,
    isAnnual,
    plan?.interval,
    plan?.name,
    currentAnnualPlan,
    currentMonthlyPlan,
    lastMonthlyPlanId,
    lastAnnualPlanId,
    activePlans,
    checkedForWinning,
    plans,
    getPlan,
    navigate,
  ]);

  const filteredPlans = useMemo(() => {
    if (isAnnual)
      return activePlans?.filter(
        (plan) => plan.interval === SubscriptionType.ANNUAL
      );
    return activePlans?.filter(
      (plan) => (plan.interval === SubscriptionType.MONTHLY && plan.for_winning === checkedForWinning)
    );
  }, [activePlans, isAnnual, checkedForWinning]);

  const handleGetBack = () => {
    if (navigationType === "POP") {
      navigate(paths.app.home);
    } else {
      const monthlyPlan = localStorage.getItem("monthlyPlan");
      if (monthlyPlan === "true") {
        navigate(paths.app.home);
      }
      else {
        const planHistory = JSON.parse(localStorage.getItem("selectedPlanHistory") || "[]");
        if (planHistory.length > 0) {
          planHistory.pop();
          const previousPlanId = planHistory[planHistory.length - 1];
          localStorage.setItem("selectedPlanHistory", JSON.stringify(planHistory));
          if (previousPlanId) {
            navigate(paths.checkout.index, { state: { selectedPlanId: previousPlanId } });
          } else {
            navigate(paths.settings.plans);
          }
        } else {
          navigate(paths.settings.plans);
        }
      }
      localStorage.removeItem("monthlyPlan");
    }
  };

  useEffect(() => {
    if (account?.active_subscription?.plan?.id === plan?.id && !!filteredPlans) {
      const plans = filteredPlans.filter(plan => plan.id !== account?.active_subscription?.plan?.id);
      if (plans.length) {
        const nextPlan = plans[(plans.length - 1) as number];

        if (nextPlan) {
          navigate({
            pathname: paths.checkout.index,
            search: searchParams.toString(),
          }, { state: { selectedPlanId: nextPlan?.id as string } });
        }
      }
    }
  }, [account?.active_subscription, plan, filteredPlans]);

  return (
    <S.PlanDetailsContainer>
      <FlexContainer gap={0.8} alignItems="center">
        <Button
          bgColor="transparent"
          padding="10px 0"
          alignItems="center"
          onClick={handleGetBack}>
          <SVG icon={faAngleLeft} color="black" />
          <S.DetailsTitle>{t("checkout.pay_securely")}</S.DetailsTitle>
        </Button>
        <S.DetailsSubtitle>{t("checkout.cancel_anytime")}</S.DetailsSubtitle>
      </FlexContainer>

      <Container
        data-testid="plan-details"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="baseline"
        shadow="none"
        padding="20px 24px"
        width="100%"
        bgColor="white"
        gap={1.6}
        radius={0.8}>
        <FlexContainer
          width="100%"
          justifyContent="space-between"
          flexWrap="wrap">
          <S.DetailsCta>{t("checkout.select_plan")}</S.DetailsCta>

          {!hideMonthlyRadio ? (
            <TogglePlan
              isAnnual={isAnnual}
              toggleControl={toggleControl}
              biggestMonthsOff={currentAnnualPlan?.months_off || 8}
            />
          ) : null}
        </FlexContainer>

        <PlanCardCheckout
          currentPlan={account?.active_subscription?.plan}
          selectedPlan={plan}
          plans={filteredPlans}
          account={account}
        />

        {plan?.interval === SubscriptionType.MONTHLY && (
          <S.PromotionalDisclaimerText>
            <S.DisclaimerContainer>
              <CustomCheckbox
                checked={checkedForWinning}
                onChange={() =>{
                  setCheckedForWinning(!checkedForWinning);
                  navigate(
                    {
                      pathname: paths.checkout.index,
                      search: searchParams.toString(),
                    },
                    { state: { selectedPlanId: getPlan(plan?.name, SubscriptionType.MONTHLY, !checkedForWinning)?.id as string } }
                  );
                }
                }
              />
              {t("checkout.plans_disclaimer")}
            </S.DisclaimerContainer>            
          </S.PromotionalDisclaimerText>
        )}

        <Separator type="horizontal" />

        {!isShopifyPayment && plan && <CouponInput plan={plan} />}
      </Container>

      <S.SafeCheckoutContainer>
        <SVG icon={faLock} />
        <span>{t("checkout.safe")}</span>
      </S.SafeCheckoutContainer>

      <S.CheckoutSeparator type="horizontal" />

      <S.CardsCheckoutImg src={CardsCheckout} />
    </S.PlanDetailsContainer>
  );
};

export default PlanDetails;
