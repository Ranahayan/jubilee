import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePlans } from "~/api/billing/queries";
import { useAccount } from "~/hooks/useAccount";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import Label from "~/components/ui/Label";
import Text from "~/components/ui/Text";
import { SubscriptionHistory, SubscriptionType } from "~/types/billing";
import * as S from "./styles";
import Modal from "~/components/ui/Modal";
import { CancelMembership } from "./cancelMembership";
import dayjs from "dayjs";
import Separator from "~/components/ui/Separator";
import {
  triggerShowPlansModal,
  triggerShowResumeModal,
} from "~/helpers/customEvents";
import { useMemo } from "react";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

type Props = {
  isShowing: boolean;
  hide: () => void;
  resumeSubscription: () => void;
  latestSubscriptionHistory?: SubscriptionHistory;
};

export const MembershipInformation = ({
  isShowing,
  hide,
  latestSubscriptionHistory,
  resumeSubscription,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: plans } = usePlans();
  const activePlans = useMemo(
    () => plans?.filter((plan) => plan.status == "AC"),
    [plans]
  );

  const { account, getAccount } = useAccount();
  const activeSubscription = account?.active_subscription;
  const lastSubscription = account?.last_subscription;

  const isCancel = account?.active_subscription?.cancel_at;
  const isPaused = account?.active_subscription?.paused_at;
  const isPastDue = account?.last_subscription?.status === "PD";
  const isCreated =
    latestSubscriptionHistory?.period_start ||
    account?.active_subscription?.created_at;

  const isActive = account?.active_subscription?.status === "AC" && !isCancel;

  const nextBillingDate = latestSubscriptionHistory?.period_end
    ? new Date(latestSubscriptionHistory.period_end)
    : null;
  const formattedNextBillingOn = isActive
    ? nextBillingDate?.toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : null;

  const formattedCancelDate = dayjs(isCancel).format("MMMM D, YYYY");

  const currentPlan = plans?.find(
    (plan) => plan.id == account?.active_subscription?.plan?.id
  );
  const isAnnual = currentPlan?.interval === SubscriptionType.ANNUAL;
  const typeAmountText = isAnnual ? "year" : "month";
  const isStarterPlan = currentPlan?.name === "Starter";
  const proPlan = activePlans?.find((plan) => plan.name == "Pro");
  const upgradedPlan = isStarterPlan
    ? proPlan
    : activePlans?.find((plan) => plan.name == currentPlan?.name);
  const planName = activeSubscription
    ? currentPlan?.name
    : lastSubscription && isPastDue
      ? lastSubscription.plan.name
      : "Basic";
  const trialEndDate = dayjs(account?.active_subscription?.trial_end_at);
  const now = dayjs();
  const daysLeft = trialEndDate.diff(now, "day");
  const annualPlans = activePlans?.filter(
    (plan) => plan.interval === SubscriptionType.ANNUAL
  );
  const mostExpensivePlan = annualPlans?.reduce((prev, current) =>
    prev.cost_per_month > current.cost_per_month ? prev : current
  );
  const isSubscriptionPaused = account?.active_subscription?.paused_at;

  const handleUpgrade = () => {
    const plan = upgradedPlan ? upgradedPlan : null;
    navigate("/checkout", { state: { selectedPlanId: plan?.id } });
  };

  return (
    <FlexContainer alignItems="flex-start" width="100%" flexDirection="column">
      <S.MembershipInfoContainer>
        <FlexContainer
          gap="16px"
          alignItems="flex-start"
          flexDirection="column">
          <Text>{t("settings.your_plan")}</Text>

          <FlexContainer gap={0.6}>
            <S.MembershipItemText>{planName}</S.MembershipItemText>
            {daysLeft > 0 ? (
              <S.TrialFlag>
                {daysLeft === 1
                  ? t("settings.day_left")
                  : t("settings.days_left", { days: daysLeft })}
              </S.TrialFlag>
            ) : isActive ? (
              <S.ActiveFlag>{t("settings.active")}</S.ActiveFlag>
            ) : null}
            {isCancel ? (
              <S.CancelledFlag>{t("settings.cancelled")}</S.CancelledFlag>
            ) : null}
            {isPaused ? (
              <S.PausedFlag>{t("settings.paused")}</S.PausedFlag>
            ) : null}
            {isPastDue ? (
              <S.PausedFlag>{t("settings.pending")}</S.PausedFlag>
            ) : null}
          </FlexContainer>
        </FlexContainer>

        {formattedNextBillingOn ? (
          <FlexContainer
            gap="16px"
            alignItems="flex-start"
            flexDirection="column">
            <Text>{t("settings.next_billing")}</Text>
            <Label alignItems="flex-start" text={formattedNextBillingOn} />
          </FlexContainer>
        ) : null}

        {isCancel ? (
          <FlexContainer
            flexDirection="column"
            alignItems="flex-start"
            gap="16px">
            <Text>{t("settings.plan_valid_until")}</Text>
            <Label alignItems="flex-start" text={formattedCancelDate} />
          </FlexContainer>
        ) : null}
      </S.MembershipInfoContainer>

      {isPaused ? (
        <Button
          color="white"
          bgColor="primary"
          size="xl"
          onClick={resumeSubscription}>
          {t("settings.unpause")}
        </Button>
      ) : null}

      {!isAnnual && activeSubscription && !DISABLE_PAYMENTS ? (
        <S.MembershipItem>
          <Button
            onClick={() => {
              if (isPaused) {
                triggerShowResumeModal();
              } else if (!DISABLE_PAYMENTS) {
                triggerShowPlansModal();
              }
            }}
            color="white"
            bgColor="primary"
            size="xl">
            {t("settings.upgrade_plan")}
          </Button>
          <Separator type="horizontal" />
          <S.BoldText>
            <Trans
              i18nKey="settings.save_up"
              values={{ plan: upgradedPlan?.name }}
              components={{
                1: <S.BoldTextPrimary />,
              }}
            />
          </S.BoldText>
          <S.GreyText>
            <Trans
              i18nKey="settings.up_to_months_off"
              values={{ days: upgradedPlan?.months_off }}
            />
          </S.GreyText>
          <Button
            color="white"
            bgColor="primary"
            size="xl"
            onClick={() =>
              isPaused ? triggerShowResumeModal() : handleUpgrade()
            }>
            {t("settings.switch")}
          </Button>
        </S.MembershipItem>
      ) : null}

      <Modal id="cancel-membership" isShowing={isShowing} hide={hide}>
        <CancelMembership
          currentPlan={currentPlan}
          hide={hide}
          refreshAccount={getAccount}
        />
      </Modal>
    </FlexContainer>
  );
};
