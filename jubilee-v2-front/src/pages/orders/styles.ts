import styled, { css } from "styled-components";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import Text from "~/components/ui/Text";
import { getColor, getColorWithAlpha, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const StyledText = styled(Text)`
  width: ${getSize(20.0)};
  text-align: right;
`;

export const FlexContainerPointed = styled(FlexContainer)`
  cursor: pointer;
  color: ${getColor("red")};

  span {
    color: ${getColor("red")};
    font-size: ${getSize(1.2)};
  }

  &:hover {
    opacity: 0.8;
  }
`;

export const SampleOrderTag = styled.span`
  font-size: ${getSize(1.2)};
  padding: 0 ${getSize(0.8)};
  border-radius: ${getSize(2.0)};
  color: ${getColor("green")};
  line-height: ${getSize(2.2)};
  font-weight: 500;
  background-color: ${getColor("greenSecondary")};
`;

export const TotalCostText = styled(Text)`
  font-weight: 500;
  font-size: ${getSize(1.6)};
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${getSize(1.0)};
`;

export const DropdownContainer = styled.div`
  position: relative;
  cursor: pointer;
  display: flex;

  svg {
    color: ${getColor("text")};
  }

  &:hover {
    svg {
      color: ${getColor("primary")};
    }
  }

  &.disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

export const DropdownButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${getSize(0.6)};
`;

export const DropdownContent = styled.div`
  top: 40px;
  right: 0;
  position: absolute;
  background-color: ${getColor("white")};
  border: 1px solid ${getColor("border")};
  border-radius: ${getSize(0.6)};
  width: auto;
  min-width: 120px;
  padding: ${getSize(0.6)};
  font-size: ${getSize(1.4)};
  z-index: 1;
`;

export const DropdownItem = styled.div`
  white-space: nowrap;
`;

export const SearchWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: ${getSize(2.0)};
`;

export const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${getSize(2.0)};
  justify-content: space-between;
  margin-bottom: ${getSize(2.0)};

  ${responsive("tablet")} {
    flex-direction: row;
  }
`;

export const OutlineButton = styled(Button)`
  border: 1px solid ${getColor("border")};
  color: ${getColor("text")};
  font-size: ${getSize(1.4)};
  font-weight: 500;
  padding: ${getSize(1.0)} ${getSize(1.2)};
  border-radius: ${getSize(0.8)};

  svg {
    color: ${getColor("primary")};
  }
`;


export const ProductImage = styled.img`
  width: ${getSize(6.0)};
  height: ${getSize(6.0)};
  object-fit: cover;
  border-radius: ${getSize(0.6)};
  margin: ${getSize(0.2)} ${getSize(0.4)};
`;

export const ProductTitle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  max-width: 300px;
  padding-left: ${getSize(0.8)};
  align-items: flex-start;
  width: 100%;

  span {
    width: 100%;
  }
`;

export const ProductTitleText = styled(Text)`
  font-size: ${getSize(1.4)};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CenterText = styled.div`
  text-align: center;
  font-size: ${getSize(1.4)};
  width: 100%;
`;


export const StatusWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export const StatusTag = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: ${getSize(0.4)};
  font-size: ${getSize(1.2)};
  font-weight: 500;
  background-color: ${getColorWithAlpha("text", 0.05)};
  border-radius: ${getSize(1.6)};
  padding: 0 ${getSize(0.8)};
`;

interface CircleProps extends UIProps {
  color: string;
}

const statusToColor: { [key: string]: string } = {
  "unpaid": "secondary",
  "processing": "success",
  "completed": "success",
  "refunded": "warning",
  "cancelled": "error",
  "order_placed": "successDark",
  "shipped": "primary",
};

export const Circle = styled.div<CircleProps>`
  width: ${getSize(0.8)};
  height: ${getSize(0.8)};
  border-radius: 50%;

  ${({ color }) => css`
    background-color: ${getColor(statusToColor[color as string])};
  `}
`;

export const ActionButton = styled(Button)`
  font-size: ${getSize(1.2)};
  font-weight: 500;
  padding: ${getSize(0.6)} ${getSize(1.6)};
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  border-radius: ${getSize(0.4)};
  padding: ${getSize(0.8)} ${getSize(1.6)};
`;

export const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${getColor("primary")};
  }
`;

export const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: ${getSize(6.0)};
`;

export const OrderHeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${getSize(1.0)};
`;
