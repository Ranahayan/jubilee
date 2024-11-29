import styled, { css } from "styled-components";
import Button from "~/components/ui/Button";
import Container from "~/components/ui/Container";
import FlexContainer from "~/components/ui/FlexContainer";
import Separator from "~/components/ui/Separator";
import { getColor, getShadow, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const CheckoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${getSize(2)};
  width: 100%;
  height: 100%;
  overflow: auto;

  ${responsive("laptop")} {
    flex-direction: row;
    padding: 0;
  }
`;

export const PlanContainer = styled.div`
  width: 100%;
  flex: 1;
  order: 2;

  ${responsive("laptop")} {
    order: 1;
    padding: ${getSize(2.8)};
  }
`;

export const ContentTitle = styled.h2`
  font-weight: 600;
  font-size: ${getSize(1.8)};
  color: ${getColor("text")};
  margin: 0;
  text-align: center;
`;

export const BillingDetailsContainer = styled(Container)`
  flex-direction: column;
  box-shadow: none;
  width: 100%;
  justify-content: flex-start;
  gap: ${getSize(2)};
  border-radius: 0;
  order: 1;
  ${responsive("laptop")} {
    width: auto;
    flex: 1 1 0;
    height: 100%;
  }
`;

export const ProrationTitle = styled.span`
  font-weight: 500;
  font-size: ${getSize(1.5)};
`;

export const ProrationAmount = styled.span`
  font-weight: 800;
  font-size: ${getSize(1.5)};
`;

export const ProrationCents = styled.span`
  font-weight: 500;
  font-size: ${getSize(0.9)};
  vertical-align: top;
  opacity: 0.6;
`;

interface IBrandContainer {
  hideOnSmall?: boolean;
}

export const BrandContainer = styled(FlexContainer)<IBrandContainer>`
  width: 100%;
  justify-content: flex-start;

  ${responsive("laptop")} {
    display: none;
  }

  ${({ hideOnSmall }) =>
    hideOnSmall &&
    css`
      display: none;
      ${responsive("laptop")} {
        display: flex;
      }
    `}
`;

export const DetailsTitle = styled.span`
  font-weight: 600;
  font-size: ${getSize(1.6)};
`;

export const DetailsSubtitle = styled.span`
  font-weight: 300;
  font-size: ${getSize(1.4)};
  font-style: italic;
  color: ${getColor("text-secondary")};
`;

export const DetailsCta = styled.span`
  font-weight: 500;
  font-size: ${getSize(1.4)};
`;

export const DisclaimerContainer = styled.div`
  display: flex;
  gap: 6px;
`;


export const PromotionalDisclaimerText = styled.span`
color: ${getColor("colorBlack")};
font-family: "Inter";
font-size: 14px;
font-style: italic;
font-weight: 300;
line-height: normal;
`;

export const PlanDetailsContainer = styled(FlexContainer)`
  flex-direction: column;
  align-items: flex-start;
  padding: 0 ${getSize(2.0)};
  margin-top: ${getSize(4.5)};

  ${responsive("laptop")} {
    padding: 0;
  }
`;

export const SafeCheckoutContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(0.9)};

  font-size: ${getSize(1.0)};
  font-weight: 500;
  margin: ${getSize(1.0)} auto 0;
`;

export const CardsCheckoutImg = styled.img`
  margin: 0 auto ${getSize(10.0)};

  ${responsive("laptop")} {
    margin-bottom: 0;
  }
`;

export const PaymentDetails = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  gap: ${getSize(1.5)};
  margin-top: ${getSize(4.2)};
  width: 100%;
  padding: 0 ${getSize(3.0)};

  ${responsive("laptop")} {
    margin-top: ${getSize(10.0)};
    /* padding: 0 ${getSize(6.3)}; */
  }
`;

export const CheckoutSeparator = styled(Separator)`
  width: ${getSize(26.0)};
  margin: ${getSize(1.4)} auto;
`;

export const FixedButton = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: ${getSize(1.6)};
  background: ${getColor("white")};
  box-shadow: ${getShadow("sm")};
  border-top: 1px solid ${getColor("border")};
  z-index: 1;
`;

export const ShopifyBilling = styled.p`
  width: 100%;
  text-align: center;
  color: ${getColor("text")};
  font-size: 16px;
`;

interface ILoader extends UIProps {
  color?: string;
}

export const Loader = styled.div<ILoader>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  & > svg {
    width: ${getSize(2)};
    height: ${getSize(2)};
  }

  & > svg > circle {
    stroke: ${({ color }) => getColor(color ?? "white")};
  }
`;

export const CouponButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${getSize(1.1)};

  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const CouponText = styled.span`
  text-decoration: underline;
  color: ${getColor("primary")};
  font-weight: 500;
  font-size: ${getSize(1.4)};
`;

export const CouponInputContainer = styled.div`
  flex: 1;
  position: relative;

  & > div > input {
    padding-right: ${getSize(4)};
  }
`;

export const ClearCouponInputButtonContainer = styled.div`
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  display: flex;
  align-items: center;
  padding-right: ${getSize(1.8)};
  background-color: ${getColor("white")};
  border-radius: ${getSize(0.6)};
`;

export const ClearCouponInputButton = styled.button`
  background: none;
  border: none;
  padding: 0;

  &:hover {
    color: ${getColor("error")};
  }
`;

export const ApplyCouponButton = styled(Button)<{ isApplying?: boolean }>`
  background-color: ${({ isDisabled, isApplying }) =>
    getColor(isDisabled && !isApplying ? "white" : "primary")};
  color: ${({ isDisabled, isApplying }) =>
    getColor(isDisabled && !isApplying ? "#2E2E2E" : "white")};
  border-color: ${({ isDisabled, isApplying }) =>
    getColor(isDisabled && !isApplying ? "border" : "primary")};
  border-width: 1px;
  border-style: solid;
  min-width: ${getSize(8.5)};

  transition:
    background-color 150ms,
    color 150ms,
    border-color 150ms;

  & svg {
    width: ${getSize(1.5)};
    height: ${getSize(1.5)};

    & > circle {
      stroke: ${getColor("white")};
    }
  }
`;

export const AppliedCouponContainer = styled.div`
  background-color: ${getColor("white")};
  border: solid 1px ${getColor("border")};
  width: 100%;
  padding: ${getSize(0.6)} ${getSize(1)};
  border-radius: ${getSize(0.6)};

  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const CouponPerkContainer = styled.div`
  background-color: ${getColor("successLight")};
  padding: ${getSize(1)} ${getSize(1.8)};
  border-radius: ${getSize(0.8)};
  width: 100%;

  display: flex;
  align-items: center;
  gap: ${getSize(1.3)};

  color: ${getColor("cyanDark")};
  font-size: ${getSize(1.2)};
  font-weight: 500;
`;

export const PayPalSeparatorText = styled.p`
  color: ${getColor("border")};
  font-size: ${getSize(1.4)};
  margin: 0;
`;

export const TermsContent = styled.div`
  font-weight: 400;
  font-size: ${getSize(1.3)};
  color: ${getColor("textSecondary")};
`;