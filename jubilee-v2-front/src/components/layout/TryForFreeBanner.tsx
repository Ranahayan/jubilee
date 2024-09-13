import { useTranslation } from "react-i18next";
import { excludePaths } from "~/constants/paths";
import { useAccount } from "~/hooks/useAccount";
import { useMemo, useState } from "react";
import CountdownTimer from "~/components/ui/Countdown";
import dayjs from "dayjs";

import * as S from "./TryForFreeBanner.style";
import { triggerShowPlansModal } from "~/helpers/customEvents";
import { usePlans } from "~/api/billing/queries";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

export const TryForFreeBanner = () => {
  const { t } = useTranslation();
  const { account } = useAccount();
  const { data: plans } = usePlans();
  const date = dayjs(account?.created_at).add(24, "hours").toDate();
  const dateNow = new Date(Date.now());

  const [isTimerDone, setIsTimerDone] = useState(false);

  const biggestMonthsOff = useMemo(() => {
    return plans?.reduce((maxMonths, plan) => {
      return Math.max(maxMonths, plan.months_off);
    }, 0);
  }, [plans]);

  const isDisplayed = useMemo(() => {
    if (DISABLE_PAYMENTS) return false;
    if (isTimerDone) return false;
    if (account?.active_subscription) return false;
    if (date > dateNow) return true;

    return false;
  }, [account, account?.created_at, isTimerDone]);

  const discountPercentage = useMemo(() => {
    if (!biggestMonthsOff) {
      return "";
    }

    const percentage = (biggestMonthsOff / 12) * 100;

    return `-${Math.floor(percentage)}%`;
  }, [biggestMonthsOff]);

  if (
    !isDisplayed ||
    excludePaths.some((path) => window.location.pathname.includes(path))
  )
    return null;

  return (
    <S.BannerContainer>
      <div>
        <S.Title>{t("banner.title")}</S.Title>
        <S.Subtitle>
          {t("banner.description", { months: biggestMonthsOff })}
        </S.Subtitle>

        <S.FooterContainer>
          <S.ClaimOfferButton
            onClick={() => triggerShowPlansModal(false, true)}>
            {t("banner.button_text")}
          </S.ClaimOfferButton>

          <CountdownTimer
            key={window.location.pathname}
            targetDate={date}
            bgColor="borderSecondary"
            numberColor="text"
            textColor="textSecondary"
            textSize="11px"
            width="57px"
            height="50px"
            numberSize="18px"
            hoursKey="hours"
            minutesKey="minutes"
            secondsKey="seconds"
            showHours
            dots
            dotsColor="#081F40"
            dotsHeight={1.5}
            callback={() => {
              setIsTimerDone(true);
            }}
          />
        </S.FooterContainer>
      </div>

      <S.DiscountTagContainer>
        <S.DiscountTagBackground />

        <S.DiscountTagText>{discountPercentage}</S.DiscountTagText>

        <S.DiscountTag>
          <DiscountTag />
        </S.DiscountTag>
      </S.DiscountTagContainer>
    </S.BannerContainer>
  );
};

const DiscountTag = () => {
  return (
    <svg
      width="137"
      height="81"
      viewBox="0 0 137 81"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2.58513 35.461C0.150008 38.4751 0.150009 42.7804 2.58513 45.7945L24.3111 72.6861C28.5477 77.93 34.9279 80.9777 41.6695 80.9777H127.577V0.277832H41.6695C34.9279 0.277832 28.5477 3.32548 24.3111 8.56945L2.58513 35.461ZM113.593 45.9871C116.553 45.9871 118.953 43.5876 118.953 40.6277C118.953 37.6679 116.553 35.2684 113.593 35.2684C110.634 35.2684 108.234 37.6679 108.234 40.6277C108.234 43.5876 110.634 45.9871 113.593 45.9871Z"
        fill="currentColor"
      />
      <path
        d="M108.168 39.6833C117.434 39.9015 135.966 44.1345 135.966 59.3208C135.966 59.3208 135.491 70.1543 127.568 70.1543"
        stroke="#191919"
        stroke-width="1.17451"
      />
      <path
        opacity="0.1"
        d="M117.581 44.2378C117.636 44.2791 117.857 44.3575 117.989 44.4156C122.542 46.4168 122.753 47.1602 126.762 51.6379C127.026 51.9328 127.115 52.0842 127.587 52.0842"
        stroke="#191919"
        stroke-width="1.17451"
      />
    </svg>
  );
};
