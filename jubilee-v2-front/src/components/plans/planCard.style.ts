import styled, { css } from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IPlanCard extends UIProps {
  primary: boolean;
}

export const PlanCardContainer = styled.div<IPlanCard>`
  align-items: baseline;
  position: relative;
  flex: 1;
  min-height: 440px;
  min-width: 160px;
  max-width: 320px;
  height: auto;
  border: 1px solid
    ${({ primary }) => getColor(primary ? "primary" : "disabled")};
  border-radius: 18px;
  overflow: hidden;

  padding: ${getSize(3.3)} ${getSize(1.4)} 0;

  background-color: ${({ primary }) =>
    getColor(primary ? "primaryLight" : "white")};

  .separator {
    background-color: ${getColor("disabled")};
    margin: ${getSize(1.4)} 0;
    width: auto;
    max-width: 100%;
  }

  ${responsive("desktop")} {
    min-height: 500px;
    padding: ${getSize(3.3)} ${getSize(2.0)} 0;
  }
`;

export const PlanCardPromotion = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${getSize(2.2)};
  text-align: center;

  display: flex;
  align-items: center;
  justify-items: center;

  font-weight: 600;
  font-size: ${getSize(1.1)};

  background-color: ${getColor("primary")};
  color: ${getColor("white")};

  & > span {
    width: 100%;
  }
`;

export const MonthsOffContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${getSize(2.2)};
  text-align: center;

  display: flex;
  align-items: center;
  justify-items: center;

  font-weight: 500;
  font-size: ${getSize(1.2)};

  background-color: ${getColor("greenSecondary")};
  color: ${getColor("green")};

  & > span {
    width: 100%;
  }
`;

export const HeaderContainer = styled.div`
  position: relative;
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
`;

export const ButtonContainer = styled.div`
  text-align: center;

  button {
    border: 1px solid ${getColor("primary")};
    padding: ${getSize(1.1)} ${getSize(2.8)};
    width: 100%;

    font-size: ${getSize(1.4)};
  }
`;

export const PlanCardTitle = styled.h2`
  font-size: ${getSize(1.6)};
  font-weight: 500;
  line-height: ${getSize(2.4)};
  letter-spacing: 0.005em;
  margin: 0;
  position: relative;
`;

interface IPlanCardSubtitle extends UIProps {
  isAnnual: boolean;
}

export const PlanCardSubtitle = styled.h3<IPlanCardSubtitle>`
  font-size: ${getSize(1.4)};
  font-weight: ${({ isAnnual }) => (isAnnual ? 500 : 400)};
  line-height: 20.87px;
  margin: ${getSize(0.7)} 0 0 0;
  color: ${({ isAnnual }) => getColor(isAnnual ? "primary" : "textDisabled")};
  background-color: ${({ isAnnual }) =>
    getColor(isAnnual ? "primary" : "transparent")}1F;

  ${({ isAnnual }) =>
    isAnnual &&
    css`
      padding: ${getSize(0.4)} ${getSize(0.8)};
    `};

  ${responsive("tablet")} {
    font-size: ${getSize(1.2)};
    line-height: 17.6px;
  }

  ${responsive("laptop")} {
    font-size: ${getSize(1.4)};
    line-height: 20.87px;
  }
`;

export const PlanCardPrice = styled.h3`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  line-height: ${getSize(1.8)};
  position: relative;
  display: flex;
  margin: ${getSize(1.0)} 0;
  align-items: center;
  white-space: nowrap;

  ${responsive("tablet")} {
    font-size: ${getSize(1.8)};
    line-height: ${getSize(1.8)};
  }

  ${responsive("laptop")} {
    font-size: ${getSize(2.4)};
    line-height: ${getSize(2.4)};
  }
`;

export const DiscountText = styled.span`
  color: ${getColor("textSecondary")};
  opacity: 0.5;
  text-decoration: line-through;
  margin-right: ${getSize(0.6)};
`;

export const MonthlyValue = styled.span`
  color: ${getColor("textDisabled")};
  opacity: 0.5;
  font-size: ${getSize(1.2)};
  font-weight: 400;

  margin-top: ${getSize(0.8)};
  line-height: 14px;

  ${responsive("tablet")} {
    margin-top: ${getSize(0.5)};
  }

  ${responsive("laptop")} {
    margin-top: ${getSize(0.8)};
  }
`;

export const DecimalValue = styled.span`
  font-size: ${getSize(1.3)};
  margin-top: ${getSize(1.0)};
  color: ${getColor("textDisabled")};
  opacity: 0.7;
  font-weight: 400;
`;

export const PlanCardList = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${getSize(1.6)};
  gap: ${getSize(1)};
  margin-top: ${getSize(2.4)};
`;

interface IPlanCardItem extends UIProps {
  disabled: boolean;
}

export const PlanCardItem = styled.div<IPlanCardItem>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${getSize(1.2)};

  opacity: ${({ disabled }) => (disabled ? 0.3 : 1)};
`;

export const PlanCardItemIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${getSize(1.0)};
  height: ${getSize(1.0)};

  & > div > svg {
    max-width: 100%;
  }
`;

export const FeatureText = styled.div`
  font-size: ${getSize(1.3)};
  line-height: ${getSize(1.8)};
  width: calc(100% - ${getSize(3.6)});
`;

export const EverythingPlusText = styled.div`
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.1)};
  font-weight: 500;

  margin-bottom: ${getSize(0.6)};
`;
