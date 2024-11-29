import { useMemo } from "react";
import { CheckoutContentBaseProps } from ".";
import { useAccount } from "~/hooks/useAccount";
import { useParams, useSearchParams } from "react-router-dom";
import { usePlans, useProrationValue } from "~/api/billing/queries";
import { IPlan, SubscriptionType } from "~/types/billing";
//@ts-ignore
import PlanDetails from "./PlanDetails";
import BillingDetails from "./BillingDetails";
import * as S from "./styles";
import { Brand } from "~/components/layout/Sidebar";
import { useMediaQuery } from "~/hooks/useMediaQuery";

interface CheckoutContentProps extends CheckoutContentBaseProps {
  isShopifyPayment?: boolean;
  onPayment: () => Promise<void>;
}

const CheckoutContent = ({
  onPayment,
  isShopifyPayment,
  clientSecret,
  isLoading,
  plan,
}: CheckoutContentProps) => {
  const { account } = useAccount();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const isLaptop = useMediaQuery("laptop");
  const { data: plans } = usePlans();
  const { data: proration, isLoading: isLoadingProration } = useProrationValue(
    params.id,
    searchParams.get("promo_code_id") ?? undefined
  );

  const getPlan = (name: string | undefined, interval: string, forWinning: boolean | undefined) => {
    return plans
      ?.filter((p) => p.status === "AC")
      ?.find((p) => p.name === name && p.interval == interval && (forWinning === p.for_winning));
  };

  const hideMonthlyRadio = false;

  return (
    <>
      <S.CheckoutContainer>
        <S.PlanContainer>
          {isLaptop && (
            <S.BrandContainer hideOnSmall>
              <Brand />
            </S.BrandContainer>
          )}
          <PlanDetails
            plan={plan}
            getPlan={getPlan}
            isShopifyPayment={!!isShopifyPayment}
            hideMonthlyRadio={hideMonthlyRadio}
          />
        </S.PlanContainer>

        <S.BillingDetailsContainer>
          {!isLaptop && (
            <S.BrandContainer>
              <Brand />
            </S.BrandContainer>
          )}
          <BillingDetails
            plan={plan}
            isShopifyPayment={!!isShopifyPayment}
            approveAndRedirectToPayment={onPayment}
            clientSecret={clientSecret}
            isLoadingCheckout={isLoading}
            isDisabled={isLoading || isLoadingProration}
            proration={proration}
            isLoadingProration={isLoadingProration}
          />
        </S.BillingDetailsContainer>
      </S.CheckoutContainer>
    </>
  );
};

export default CheckoutContent;
