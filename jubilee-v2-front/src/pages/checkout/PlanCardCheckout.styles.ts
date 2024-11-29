import styled, { css } from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IPlansCardGrid extends UIProps {
  plansCount: number;
}

export const PlansCardGrid = styled.div<IPlansCardGrid>`
  display: flex;
  gap: ${getSize(1.0)};
  flex-wrap: wrap;
  width: 100%;
`;

interface IHighlightable extends UIProps {
  isHighlighted: boolean;
  isSelected?: boolean;
  isCurrentPlan?: boolean;
}

export const CardContainer = styled.div<IHighlightable>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: ${getSize(20.0)};
  border-radius: ${getSize(0.5)};
  border: 1px solid
    ${({ isSelected }) =>
      getColor(isSelected ? "primary" : "border")};
  opacity: ${({ isSelected, isHighlighted, isCurrentPlan }) => {
    if (isCurrentPlan) return 0.5;
    return (isSelected || isHighlighted ? 1 : 0.8)
  }};
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;

  ${({ isCurrentPlan }) => css`pointer-events: ${isCurrentPlan ? "none" : "auto"};`}

  &:hover {
    opacity: 1;
  }
`;

export const MostPopularTag = styled.span`
  color: ${getColor("white")};
  background-color: ${getColor("primary")};
  font-weight: 800;
  font-size: ${getSize(1.0)};
  text-align: center;
  width: 100%;
`;

export const Title = styled.span`
  font-weight: 500;
  font-size: ${getSize(1.3)};
  line-height: ${getSize(1.6)};
`;

export const Price = styled.span<IHighlightable>`
  font-weight: 500;
  font-size: ${getSize(1.3)};
  color: ${({ isSelected }) => getColor(isSelected ? "primary" : "text")};
`;

export const Prices = styled.div`
  display: flex;
  gap: 6px;
`;

export const CurrentPrice = styled.span<IHighlightable>`
  color: ${getColor("colorBlack")};
  font-family: "Inter Variable";
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;

export const OriginalPriceStrikethrough = styled.span<IHighlightable>`
  color: ${getColor("textDisabled")};
  font-family: "Inter Variable";
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  text-decoration-line: line-through;
  opacity: 0.6;
`;

export const PromotionalPrice = styled.span<IHighlightable>`
font-family: "Inter";
font-weight: 500;
font-size: 13px;
font-style: normal;
font-weight: 400;
line-height: normal;
color: ${({ isSelected }) => getColor(isSelected ? "primary" : "colorBlack")};
`;

export const PriceSmall = styled.span<IHighlightable>`
  font-weight: 500;
  font-size: ${getSize(0.9)};
  color: ${({ isSelected }) => getColor(isSelected ? "primary" : "text")};
  vertical-align: top;
`;

export const Radio = styled.input`
  accent-color: ${getColor("primary")};
  margin-bottom: ${getSize(0.3)};
`;

export const InnerContainer = styled.div<IHighlightable>`
  padding: ${({ isHighlighted }) => getSize(isHighlighted ? 0.7 : 2.0)}
    ${getSize(1.0)} ${({ isHighlighted }) => getSize(isHighlighted ? 2.1 : 2.5)};
  align-self: flex-start;

  display: flex;
  flex-direction: column;
  gap: ${getSize(1.2)};
  width: 100%;
`;

export const Feature = styled.span`
  font-size: ${getSize(1.2)};
  font-weight: 400;
  line-height: ${getSize(1.4)};
`;

export const IconCheckContainer = styled.div`
  background-color: ${getColor("greenSecondary")};
  color: ${getColor("green")};
  border-radius: 50%;
  width: ${getSize(1.2)};
  height: ${getSize(1.2)};
  font-size: ${getSize(0.6)};
  line-height: ${getSize(1.4)};
  display: flex;
  justify-content: center;
  align-items: center;
  filter: contrast(95%);
`;
