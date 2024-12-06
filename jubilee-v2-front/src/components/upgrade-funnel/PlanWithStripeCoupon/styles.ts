import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getShadow, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const Content = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  background-color: ${getColor("blueDeep")};
  color: ${getColor("white")};
  padding: ${getSize(7.0)} ${getSize(3.2)};

  ${responsive("laptop")} {
    width: 850px;
    padding: ${getSize(7.0)} ${getSize(10.7)};
  }
`;

export const Title = styled.h1`
  font-weight: 700;
  font-size: ${getSize(2.8)};
  text-align: center;
  margin: 0;
`;

export const DiscountTitle = styled.span`
  font-weight: 700;
  color: #01a42f;
`;

export const Subtitle = styled.p`
  margin: ${getSize(1.4)} 0 0 0;
  font-weight: 400;
  font-size: ${getSize(1.5)};
  text-align: center;
  opacity: 0.7;
`;

export const PlanSummaryContainer = styled.div`
  margin: ${getSize(2.0)} auto;

  border: solid 1px rgba(255, 255, 255, 0.12);
  border-radius: ${getSize(0.9)};
  padding: ${getSize(1.8)};

  max-width: ${getSize(50.0)};
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: ${getSize(1.8)};
`;

export const PlanSummaryLine = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${getSize(1.2)};

  ${responsive("tablet")} {
    grid-template-columns: 1fr 1fr;
    gap: ${getSize(1.8)};
  }
`;

export const PlanBenefits = styled.span`
  font-weight: 600;
  font-size: ${getSize(1.6)};

  margin: 0 auto;

  ${responsive("tablet")} {
    margin: 0;
  }
`;

export const PlanPriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(0.6)};

  margin: 0 auto;

  ${responsive("tablet")} {
    margin: 0 0 0 auto;
  }
`;

export const PlanOriginalPrice = styled.span`
  font-weight: 500;
  font-size: ${getSize(2.0)};
  opacity: 0.5;
  text-decoration: line-through;
  line-height: ${getSize(2.42)};
`;

export const PlanDiscountedPrice = styled.span`
  font-weight: 600;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(2.178)};
`;

export const PerMonth = styled.span`
  font-weight: 500;
  font-size: ${getSize(1.1)};
  opacity: 0.3;
`;

export const PlanFeature = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(0.9)};

  font-weight: 600;
  font-size: ${getSize(1.4)};

  margin: 0 auto;

  ${responsive("tablet")} {
    margin: 0;

    &:nth-child(even) {
      margin: 0 0 0 auto;
    }
  }
`;

export const CountdownTimerContainer = styled.div`
  margin: 0 auto;
  max-width: ${getSize(50.0)};
  width: 100%;
`;

export const SwitchToPlan = styled(Button)`
  background-color: ${getColor("successDark")};
  border-radius: 9999px;
  padding: ${getSize(1.8)};
  box-shadow: 0px 17.19px 115.4px -12.28px #0000000d;

  width: 100%;
  max-width: ${getSize(50.0)};
  margin: ${getSize(1.6)} auto 0;

  color: ${getColor("white")};
  font-weight: 600;
  font-size: ${getSize(1.8)};
`;

export const ContinueWithCurrentPlan = styled(Button)`
  margin: ${getSize(1.6)} auto 0;
  background-color: transparent;
  color: ${getColor("white")};
  opacity: 0.5;
`;

interface IStarsSvg extends UIProps {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export const StarsSvg = styled.svg<IStarsSvg>`
  position: absolute;

  top: ${({ top }) => (top ? getSize(top) : "auto")};
  bottom: ${({ bottom }) => (bottom ? getSize(bottom) : "auto")};
  left: ${({ left }) => (left ? getSize(left) : "auto")};
  right: ${({ right }) => (right ? getSize(right) : "auto")};
`;
