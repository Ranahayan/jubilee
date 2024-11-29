import LoaderSVG from "~/assets/svg/loader.svg?react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import { faCreditCard } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "~/components/ui/SVG/types";
import Button from "~/components/ui/Button";
import { useAccount } from "~/hooks/useAccount";
import PaymentElements from "~/components/payment-elements";
import { IPlan, IProration, SubscriptionType } from "~/types/billing";
import * as S from "./styles";
import { DISABLE_TRIAL_FEES, getCheckoutAction } from "~/helpers/plans";
import { PaypalButton } from "./PaypalButton";
import Separator from "~/components/ui/Separator";
import {
  centsToDecimal,
  getTotalPlanCost,
  splitNumber,
} from "~/helpers/numbers";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useSearchParams } from "react-router-dom";
import { TermsAndConditions } from "~/components/terms-and-conditions/termsAndConditions";

const isPaypalEnabledFromEnv = import.meta.env.VITE_DISABLE_PAYPAL !== "true";

type Props = {
  isShopifyPayment: boolean;
  clientSecret?: string;
  isLoadingCheckout?: boolean;
  approveAndRedirectToPayment: () => Promise<void>;
  isDisabled: boolean;
  plan?: IPlan;
  proration?: IProration;
  isLoadingProration?: boolean;
};

const BillingDetails = ({
  isShopifyPayment,
  clientSecret,
  isLoadingCheckout,
  approveAndRedirectToPayment,
  isDisabled,
  plan,
  proration,
  isLoadingProration,
}: Props) => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { account } = useAccount();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const isPaypalEnabled =
    isPaypalEnabledFromEnv || searchParams.get("paypal") === "true";

  const isSubscribed = account?.has_subscribed_before;
  const isFirstTimeUser = !isSubscribed;

  const total = useMemo(() => {
    const calculateTotal = () => {
      // No trial on annual plans - always show full amount (Stripe and Shopify)
      if (plan?.interval === SubscriptionType.ANNUAL) {
        return getTotalPlanCost(plan);
      }
      if (isFirstTimeUser) {
        if (account?.payment_provider === "shopify") {
          return 0;
        }
        if (account?.payment_provider === "stripe") {
          return 1;
        }
      }

      return getTotalPlanCost(plan);
    };

    return calculateTotal();
  }, [isFirstTimeUser, account?.payment_provider, plan]);


  // const splitTotal = plan?.store_creation_tax_cents
  //   ? splitNumber(centsToDecimal(plan?.store_creation_tax_cents ?? 0))
  //   : splitNumber(total);
  // Now showing the cost per month instead of the store creation tax cents
  const splitTotal = splitNumber(total);
    
  const checkoutButtonText = useMemo(() => {
    const checkoutAction = getCheckoutAction(account, plan);

    if (checkoutAction === "trial") return t("checkout.checkout_button");

    if (checkoutAction === "downgrade") {
      return (
        <Trans
          i18nKey="checkout.downgrade_button"
          values={{ value: plan?.name }}
        />
      );
    }

    return (
      <Trans i18nKey="checkout.upgrade_button" values={{ value: plan?.name }} />
    );
  }, [account, plan]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null, // Use the viewport as the root
        threshold: 0, // Trigger when even one pixel is visible
      }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  if (!isShopifyPayment && !clientSecret) return null;

  return (
    <S.PaymentDetails>
      <S.ContentTitle>{t("checkout.billing_details")}</S.ContentTitle>

      {isPaypalEnabled && !isShopifyPayment && (
        <>
          <PaypalButton planId={plan!.id!} />

          <FlexContainer gap={2.0}>
            <Separator type="horizontal" />
            <S.PayPalSeparatorText>{t("checkout.or")}</S.PayPalSeparatorText>
            <Separator type="horizontal" />
          </FlexContainer>
        </>
      )}

      {isShopifyPayment ? (
        <S.ShopifyBilling>{t("checkout.shopify_billing")}</S.ShopifyBilling>
      ) : (account?.stripe_card_digits && !showForm) || !clientSecret ? (
        <FlexContainer justifyContent="space-between" gap={4.0} flexWrap="wrap">
          <FlexContainer>
            <SVG color="primary" icon={faCreditCard as SVGIcon} /> **** ****
            **** {account?.stripe_card_digits}
          </FlexContainer>
          <Button onClick={() => setShowForm(true)} padding="14px 28px" outline>
            {t("checkout.update_payment")}
          </Button>
        </FlexContainer>
      ) : (
        <PaymentElements clientSecret={clientSecret} />
      )}

      <FlexContainer flexDirection="column" alignItems="flex-start" gap={1.6}>
        <S.TermsContent>
          <TermsAndConditions color="primary" textDecoration="underline" />
        </S.TermsContent>
        <Separator type="horizontal" />
        <FlexContainer justifyContent="space-between" width="100%">
          <S.ProrationTitle>{t("checkout.proration_total")}</S.ProrationTitle>
         
          {isLoadingProration ? (
            <Skeleton height={20} width={50} />
          ) : (
            <span>
              <S.ProrationAmount>${splitTotal.integer}</S.ProrationAmount>
              <S.ProrationCents>{splitTotal.decimal}</S.ProrationCents>
            </span>
          )}
        </FlexContainer>
        <Separator type="horizontal" />
      </FlexContainer>

      <div ref={ref}>
        <Button
          size="xl"
          bgColor="primary"
          color="white"
          width="100%"
          long
          onClick={approveAndRedirectToPayment}
          isDisabled={isDisabled}>
          {isLoadingCheckout ? (
            <S.Loader>
              <LoaderSVG />
            </S.Loader>
          ) : (
            checkoutButtonText
          )}
        </Button>
      </div>

      {!isVisible ? (
        <S.FixedButton>
          <Button
            size="xl"
            bgColor="primary"
            color="white"
            width="100%"
            long
            onClick={approveAndRedirectToPayment}
            isDisabled={isDisabled}>
            {isLoadingCheckout ? (
              <S.Loader>
                <LoaderSVG />
              </S.Loader>
            ) : (
              checkoutButtonText
            )}
          </Button>
        </S.FixedButton>
      ) : null}
    </S.PaymentDetails>
  );
};

export default BillingDetails;
