import * as S from "./styles";
import CountdownTimer from "~/components/ui/Countdown";
import { Trans, useTranslation } from "react-i18next";
import { ICountdownTimerProps } from "~/types/countdown";
import { TermsAndConditions } from "../../terms-and-conditions/termsAndConditions";
import { SVG } from "~/components/ui/SVG";
import { faBolt } from "@fortawesome/pro-light-svg-icons";
import { faArrowRightLong } from "@fortawesome/pro-solid-svg-icons";
import { useMediaQuery } from "~/hooks/useMediaQuery";

interface IMonthlyPlan extends ICountdownTimerProps {
  monthsFree: number;
  monthlyPrice: number;
  monthlyOldPrice: number;
  planName: string;
  callback: () => void;
  close: () => void;
}

export const MonthlyPlan = ({
  targetDate,
  monthsFree,
  monthlyPrice,
  monthlyOldPrice,
  planName,
  callback,
  close,
}: IMonthlyPlan) => {
  const { t } = useTranslation();
  const isPhone = useMediaQuery("mobileL");

  return (
    <S.Content>
      <StarsTop />
      <StarsBottom />

      <S.Title>
        <Trans
          i18nKey="upgrade_funnel.months_free"
          values={{
            planName: planName,
            monthsFree: monthsFree,
          }}
          components={{
            1: <S.HighlightText />,
          }}
        />
      </S.Title>

      <S.SimpleText>
        <Trans
          i18nKey="upgrade_funnel.get_plan"
          values={{
            planName: planName,
            monthlyPrice: monthlyPrice,
            monthlyOldPrice: monthlyOldPrice,
          }}
          components={{
            1: <s />,
            2: <b />,
          }}
        />
      </S.SimpleText>

      <CountdownTimer
        targetDate={targetDate}
        bgColor="background"
        width={isPhone ? "185px" : "120px"}
        height="77px"
        numberColor="text"
        textColor="textSecondary"
        numberSize="44px"
        textSize="16px"
        minutesKey="minutes"
        secondsKey="seconds"
        gap={2}
        dots={true}
        lineHeight={1}
        keysOutside
        borderColor="border"
        dotsColor="text"
        callback={close}
      />

      <S.CTAButton onClick={callback}>
        <SVG icon={faBolt} color="white" />
        {t("upgrade_funnel.upgrade")}
      </S.CTAButton>

      <S.TermsContent>
        <TermsAndConditions color="textSecondary" textDecoration="underline" />
      </S.TermsContent>

      <S.CenteredText>
        {t("upgrade_funnel.total_cost_processed")}
      </S.CenteredText>

      <S.SimpleTextAnchor onClick={close}>
        {t("upgrade_funnel.no_thanks")}
        <SVG icon={faArrowRightLong} />
      </S.SimpleTextAnchor>
    </S.Content>
  );
};

const StarsTop = () => {
  return (
    <S.StarsSvg
      xmlns="http://www.w3.org/2000/svg"
      width="157"
      height="84"
      fill="none"
      top={0.4}
      right={0.8}>
      <path
        d="M13.73 40.173a1 1 0 0 0-1.755.035L9.283 45.37a1 1 0 0 1-.39.406l-5.051 2.891a1 1 0 0 0 .034 1.755l5.16 2.692a1 1 0 0 1 .404.39l2.895 5.055a1 1 0 0 0 1.754-.035l2.696-5.163a1 1 0 0 1 .39-.405l5.048-2.892a1 1 0 0 0-.034-1.754l-5.16-2.693a1 1 0 0 1-.405-.39l-2.895-5.053ZM83.641 13.945a1 1 0 0 0-1.754.035l-2.692 5.162a1 1 0 0 1-.39.405l-5.05 2.892a1 1 0 0 0 .033 1.755l5.16 2.692a1 1 0 0 1 .405.39l2.894 5.055a1 1 0 0 0 1.754-.035l2.696-5.163a1 1 0 0 1 .39-.405l5.048-2.892a1 1 0 0 0-.034-1.754l-5.16-2.693a1 1 0 0 1-.405-.39l-2.895-5.054Z"
        opacity=".2"
      />
      <path
        strokeLinecap="round"
        strokeWidth="3"
        d="m95.377 81.534 59.379-56.198"
        opacity=".2"
      />
    </S.StarsSvg>
  );
};

const StarsBottom = () => {
  return (
    <S.StarsSvg
      xmlns="http://www.w3.org/2000/svg"
      width="171"
      height="83"
      fill="none"
      bottom={0.5}
      left={1.2}>
      <path
        fill="#FDBA76"
        d="M10.11 79.792a1 1 0 0 1-1.755-.035L6.6 76.391a1 1 0 0 0-.39-.405L2.916 74.1a1 1 0 0 1 .034-1.755l3.364-1.756a1 1 0 0 0 .405-.39l1.889-3.296a1 1 0 0 1 1.754.034l1.758 3.368c.089.17.224.31.39.405l3.292 1.886a1 1 0 0 1-.034 1.754l-3.365 1.756a1 1 0 0 0-.405.39l-1.888 3.296Z"
        opacity=".2"
      />
      <path
        stroke="#FDBA76"
        strokeLinecap="round"
        strokeWidth="3"
        d="m28.878 2.474 59.379 56.199"
        opacity=".2"
      />
      <path
        fill="#FDBA76"
        d="M153.502 56.882a1 1 0 0 1-1.755-.034l-4.368-8.377a1.004 1.004 0 0 0-.39-.406l-8.197-4.693a1 1 0 0 1 .034-1.754l8.372-4.37a.997.997 0 0 0 .405-.39l4.698-8.201a1 1 0 0 1 1.754.034l4.374 8.378c.089.17.224.31.39.405l8.192 4.693a1 1 0 0 1-.034 1.754l-8.373 4.37c-.169.089-.31.224-.405.39l-4.697 8.201Z"
        opacity=".2"
      />
    </S.StarsSvg>
  );
};
