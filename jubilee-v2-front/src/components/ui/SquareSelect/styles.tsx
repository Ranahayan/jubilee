import styled from "styled-components";
import { getColor, getColorWithAlpha, getSize } from "~/helpers/style";
import { ISquareOption } from "~/types/squareOption";
import { UIFlexProps } from "~/types/style";

interface SquareButton extends UIFlexProps {
  isSelected: boolean;
  isSmall: boolean;
}

interface ISquare extends SquareButton, ISquareOption, UIFlexProps {
  padding?: number;
}

interface ISquareSelect extends UIFlexProps {
  isDisabled: boolean;
}

export const SquareSelect = styled.div<ISquareSelect>`
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${getSize(2.0)};
  opacity: ${({ isDisabled }) => (isDisabled ? "0.7" : "1")};
  ${({ isDisabled }) => (isDisabled ? "pointer-events: none;" : "")}
`;

export const Square = styled.div<ISquare>`
  width: ${({ isSmall }) => (isSmall ? getSize(4.8) : getSize(6.1))};
  height: ${({ isSmall }) => (isSmall ? getSize(4.8) : getSize(6.1))};
  border: 1px solid
    ${({ isSelected }) => getColor(isSelected ? "primary" : "border")};
  outline: 1px solid
    ${({ isSelected }) => getColor(isSelected ? "primary" : "transparent")};
  border-radius: ${getSize(0.9)};
  padding: ${({ padding }) => (padding ? getSize(padding) : "0")};
  display: inline-block;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    filter: brightness(0.9);
  }

  > img {
    width: 100%;
    height: 100%;
  }
`;

export const SquareButton = styled.div<SquareButton>`
  width: ${({ isSmall }) => (isSmall ? getSize(4.8) : getSize(6.1))};
  height: ${({ isSmall }) => (isSmall ? getSize(4.8) : getSize(6.1))};
  box-sizing: border-box;
  display: inline-block;
  border: 1px solid
    ${({ isSelected }) => getColor(isSelected ? "primary" : "border")};
  outline: 1px solid
    ${({ isSelected }) => getColor(isSelected ? "primary" : "transparent")};
  border-radius: ${getSize(0.9)};
  background-color: ${getColorWithAlpha("black300", 0.06)};
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: ${({ isSmall }) => (isSmall ? "10px" : "14px")};
  line-height: ${getSize(1.8)};
  color: ${getColorWithAlpha("text", 0.3)};
  cursor: pointer;

  &:hover {
    filter: brightness(0.9);
  }
`;

export const Divider = styled.div`
  width: 1px;
  height: ${getSize(3.2)};
  border-right: 1px solid ${getColor("border")};
  display: inline-block;
`;
