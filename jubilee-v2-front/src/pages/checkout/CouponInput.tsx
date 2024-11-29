import { faCircleCheck, faTag } from "@fortawesome/pro-solid-svg-icons";
import * as S from "./styles";
import LoaderSVG from "~/assets/svg/loader.svg?react";
import { SVG } from "~/components/ui/SVG";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import FlexContainer from "~/components/ui/FlexContainer";
import { faCircleXmark } from "@fortawesome/pro-regular-svg-icons";
import Input from "~/components/ui/Input";
import { getPromoCode } from "~/api/billing/requests";
import handleErrors from "~/helpers/handleErrors";
import { useSearchParams } from "react-router-dom";
import { IPlan, SubscriptionType } from "~/types/billing";
import {
  centsToDecimal,
  formatCurrency,
  formatPercentage,
} from "~/helpers/numbers";
import { StripePromoCode } from "~/api/billing/types";

interface Props {
  plan: IPlan;
}

type State =
  | { status: "closed" }
  | { status: "open" }
  | { status: "applying"; fromSearchParam: boolean }
  | {
      status: "applied";
      promoCode: StripePromoCode;
    };

export const CouponInput = ({ plan }: Props) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamCoupon = searchParams.get("coupon");

  const [state, setState] = useState<State>(
    searchParamCoupon
      ? { status: "applying", fromSearchParam: true }
      : { status: "closed" }
  );
  const [coupon, setCoupon] = useState<string>(searchParamCoupon ?? "");

  useEffect(() => {
    if (state.status === "applying" && state.fromSearchParam) {
      handleApplyCoupon();
    }
  }, [state]);

  const handleApplyCoupon = async (fromSearchParam?: boolean) => {
    setState({ status: "applying", fromSearchParam: fromSearchParam ?? false });

    const toastMessages = {
      error: t("checkout.error_applying_coupon"),
    };

    const { response, errors } = await handleErrors(
      () => getPromoCode(coupon, plan.id as string),
      toastMessages
    );

    if (errors) {
      setState({ status: "open" });
      return;
    }

    setState({
      status: "applied",
      promoCode: response,
    });
    setSearchParams((prev) => ({
      ...Object.fromEntries(prev.entries()),
      promo_code_id: response.promo_code_id,
      coupon,
    }));
  };

  return (
    <FlexContainer
      flexDirection="column"
      alignItems="flex-start"
      width="100%"
      gap={1.2}>
      {state.status !== "applied" && (
        <S.CouponButton
          onClick={() =>
            setState((prevState) =>
              prevState.status === "closed"
                ? { status: "open" }
                : { status: "closed" }
            )
          }>
          <SVG icon={faTag} color="primary" />
          <S.CouponText>{t("checkout.coupon_button")}</S.CouponText>
        </S.CouponButton>
      )}

      {(state.status === "open" || state.status === "applying") && (
        <FlexContainer width="100%">
          <S.CouponInputContainer>
            <Input
              type="string"
              width="100%"
              placeholder={t("checkout.enter_coupon") ?? undefined}
              value={coupon}
              onChange={(e) => setCoupon(e.currentTarget.value)}
              disabled={state.status === "applying"}
            />
            <S.ClearCouponInputButtonContainer>
              <S.ClearCouponInputButton onClick={() => setCoupon("")}>
                <SVG icon={faCircleXmark} />
              </S.ClearCouponInputButton>
            </S.ClearCouponInputButtonContainer>
          </S.CouponInputContainer>

          <S.ApplyCouponButton
            isDisabled={coupon.length === 0 || state.status === "applying"}
            isApplying={state.status === "applying"}
            onClick={() => handleApplyCoupon()}>
            {state.status === "open" ? (
              t("checkout.validate_coupon")
            ) : (
              <LoaderSVG />
            )}
          </S.ApplyCouponButton>
        </FlexContainer>
      )}

      {state.status === "applied" && (
        <AppliedBanner
          clear={() => {
            setCoupon("");
            setState({ status: "closed" });
            setSearchParams((prev) => {
              prev.delete("promo_code_id");
              prev.delete("coupon");

              return prev;
            });
          }}
          coupon={coupon}
          plan={plan}
          promoCode={state.promoCode}
        />
      )}
    </FlexContainer>
  );
};

const AppliedBanner = ({
  clear,
  promoCode,
  coupon,
  plan,
}: {
  clear: () => void;
  promoCode: StripePromoCode;
  coupon: string;
  plan: IPlan;
}) => {
  const { t } = useTranslation();

  const discount = promoCode.percent_off
    ? formatPercentage(promoCode.percent_off)
    : promoCode.amount_off
      ? formatCurrency(
          centsToDecimal(promoCode.amount_off),
          promoCode.currency ?? "USD"
        )
      : null;

  return (
    <>
      <S.AppliedCouponContainer>
        <span>{coupon}</span>
        <S.ClearCouponInputButton onClick={() => clear()}>
          <SVG icon={faCircleXmark} />
        </S.ClearCouponInputButton>
      </S.AppliedCouponContainer>

      <S.CouponPerkContainer>
        <SVG icon={faCircleCheck} color="cyanDark" size="lg" />
        {discount === null
          ? t("checkout.applied_coupon")
          : promoCode.duration_in_months === null
            ? t("checkout.applied_infinite_coupon", {
                discount,
              })
            : plan.interval === SubscriptionType.ANNUAL
              ? t("checkout.applied_coupon_annual", {
                  discount,
                })
              : t("checkout.applied_coupon", {
                  count: promoCode.duration_in_months,
                  discount,
                })}
      </S.CouponPerkContainer>
    </>
  );
};
