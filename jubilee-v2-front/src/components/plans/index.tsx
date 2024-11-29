import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IPlan, SubscriptionType } from "~/types/billing";
import { usePlans } from "~/api/billing/queries";
import PlanCard from "./planCard";
import Loader from "~/components/ui/Loader";
import { useDebounceEffect } from "~/hooks/useDebounceEffect";
import * as S from "./plans.style";
import { useAccount } from "~/hooks/useAccount";
import { TogglePlan } from "./togglePlan";
import { faCircleInfo } from "@fortawesome/pro-light-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";

interface PlansProps {
  closeModal?: () => void;
  initialIsAnnual?: boolean;
  handleClickCheckout?: (plan: IPlan) => void;
}

export const Plans = ({
  closeModal,
  initialIsAnnual = false,
  handleClickCheckout,
}: PlansProps) => {
  const { t } = useTranslation();
  const { account, getAccount } = useAccount();
  const { data: plans, isLoading } = usePlans();

  const [isAnnual, setIsAnnual] = useState<boolean>(initialIsAnnual);
    
  const isSubscriptionCancelled = !!account?.active_subscription?.cancel_at;

  // Memoized plan data
  const activePlans = useMemo(
    () => plans?.filter((plan) => plan.status === "AC"),
    [plans]
  );

  const filteredPlans = useMemo(() => {
    if (isAnnual) {
      return activePlans?.filter(
        (plan) => plan.interval === SubscriptionType.ANNUAL
      );
    }
    return activePlans?.filter(
      (plan) => plan.interval === SubscriptionType.MONTHLY && plan.for_winning
    );
  }, [activePlans, isAnnual]);

  const biggestMonthsOff = useMemo(
    () =>
      plans?.reduce(
        (maxMonths, plan) => Math.max(maxMonths, plan.months_off),
        0
      ),
    [plans]
  );

  const highestPricePlan = useMemo(
    () =>
      filteredPlans?.reduce(
        (prev, current) =>
          current.cost_per_month > prev.cost_per_month ? current : prev,
        filteredPlans[0]
      ),
    [filteredPlans]
  );

  const toggleControl = useCallback(
    () => setIsAnnual(!isAnnual),
    [isAnnual]
  );

  useDebounceEffect(
    () => {
      // Fix the current plan bug when a user subscribes and the store isn't updated
      getAccount();
    },
    [],
    100
  );

  if (isLoading) {
    return <Loader />;
  }

  const getPreviousPlanName = (index: number) => {
    if (index > 0) return filteredPlans?.[index - 1].name || null;

    if (isAnnual && index === 0) {
      return (
        activePlans?.find((plan) => plan.interval === SubscriptionType.MONTHLY)
          ?.name || null
      );
    }

    return null;
  };

  return (
    <Fragment>
      <S.PageTitle>{t("settings.choose_plan")}</S.PageTitle>

      <TogglePlan
        isAnnual={isAnnual}
        toggleControl={toggleControl}
        biggestMonthsOff={biggestMonthsOff}
      />

      {/* {isAnnual && !isSubscriptionCancelled && (
        <S.DowngradeNoteWrapper>
          <S.DowngradeNote>
            <SVG icon={faCircleInfo as SVGIcon} color="black" />
            <S.DowngradeNoteText>
              {t("settings.cannot_downgrade_note")}
            </S.DowngradeNoteText>
          </S.DowngradeNote>
        </S.DowngradeNoteWrapper>
      )} */}

      <S.PlansGrid gap={closeModal ? 2 : 1}>
        {filteredPlans?.map((plan, index) => (
          <PlanCard
            account={account}
            key={plan.id}
            plan={plan}
            closeModal={closeModal}
            isHighestPrice={plan.id === highestPricePlan?.id}
            previousPlanName={getPreviousPlanName(index)}
            handleClick={handleClickCheckout}
          />
        ))}
      </S.PlansGrid>
    </Fragment>
  );
};
