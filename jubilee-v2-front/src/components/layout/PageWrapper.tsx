import React, { useEffect, useMemo, useState } from "react";
import * as S from "./PageWrapper.style";
import { UpgradeButton } from "./UpgradeButton";
import { TryForFreeBanner } from "./TryForFreeBanner";
import { Notifications } from "~/components/notifications";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { PlansModal } from "~/components/plans/plansModal";
import { ResumeModal } from "~/components/resumeModal";
import { LimitsModal } from "../limits-modal";
import { useAccount } from "~/hooks/useAccount";
import { useNavigate } from "react-router-dom";
import { Onboarding } from "../onboarding";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { usePlans } from "~/api/billing/queries";
import { paths } from "~/router/paths";
import { SubscriptionType } from "~/types/billing";
import { PlanStatus } from "~/types/account";
import { Userpilot } from "userpilot";
import { useLocation } from 'react-router-dom';
import { ModalConnectToStore } from "../connect-to-store/modal";
import { AnualPlansModal } from "../plans/anualPlansModal";
import { DTPromotionModal } from "../dt-promotion-modal";

interface IProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<IProps> = ({ children = null }) => {
  const { getAccount } = useAccount();
  const isSettingsPage = location.pathname.includes("settings");
  const isNotMobile = useMediaQuery("tablet");
  const queryParams = new URLSearchParams(location.search);
  const [isShowingOnboarding, setIsShowingOnboarding] = useState(false);
  const planId = queryParams.get("plan_id");
  const showRating = queryParams.get("show_rating");
  const onboarding = queryParams.get("onboarding");
  const annual = queryParams.get("annual");
  const { data: plans } = usePlans();
  const activePlans = plans?.filter((plan) => plan.status === PlanStatus.ACTIVE);
  const empirePlan = useMemo(
    () =>
      activePlans?.find(
        (plan) =>
          plan.name === "Empire" && plan.interval === SubscriptionType.MONTHLY && plan.for_winning
      ),
    [plans]
  );
  const navigate = useNavigate();
  const pageLocation = useLocation();

  useEffect(() => {
    Userpilot.reload();
  }, [pageLocation]);

  useEffect(() => {
    const checkOnboardingCondition = async () => {
      const account = await getAccount();

      if (onboarding && account && !account?.active_subscription) {
        setIsShowingOnboarding(true);
      }

      const searchParams = new URLSearchParams(window.location.search);

      if(annual) {
        searchParams.set("annual", "true");
        navigate(`?${searchParams.toString()}`);
      }

      if (
        account &&
        !account?.active_subscription &&
        !account?.has_subscribed_before &&
        !planId &&
        !showRating
      ) {
        searchParams.set("onboarding", "true");
        searchParams.set("origin", account?.signup_origin);
        navigate(`?${searchParams.toString()}`);
      } else if (!!onboarding) {
        setIsShowingOnboarding(false);
        searchParams.delete("onboarding");
        const queryParams = searchParams.toString();
        const newUrl =
          window.location.pathname + (!!queryParams ? `?${queryParams}` : "");
        window.history.replaceState(null, "", newUrl);
      }
    };

    checkOnboardingCondition();
  }, [planId, onboarding]);

  return (
    <S.PageWrapper
      padding={isSettingsPage ? "24px 25px 58px" : "24px 92px 58px"}>
      <S.PageHeader>
        <UpgradeButton />
        {isNotMobile ? <Notifications /> : null}
      </S.PageHeader>
      <S.PageMaxWidth>
        <TryForFreeBanner />
        <>{children}</>
      </S.PageMaxWidth>
      <PlansModal />
      <DTPromotionModal />
      <AnualPlansModal />
      <ResumeModal />
      <LimitsModal />
      <ModalConnectToStore />

      <Onboarding
        isShowing={isShowingOnboarding}
        onFinish={() => {
          if (DISABLE_PAYMENTS) {
            setIsShowingOnboarding(false);
          } else {
            navigate({
              pathname: paths.checkout.index,
            }, { state: { selectedPlanId: empirePlan?.id || "" } });
          }
        }}
      />
    </S.PageWrapper>
  );
};

export const PageWrapperFullScreen: React.FC<IProps> = ({
  children = null,
}) => {
  const pageLocation = useLocation();

  useEffect(() => {
    Userpilot.reload();
  }, [pageLocation]);

  return (
    <S.PageWrapperFullscreen>
      <PlansModal />
      <AnualPlansModal />
      <ResumeModal />
      <LimitsModal />
      <>{children}</>
    </S.PageWrapperFullscreen>
  );
};
