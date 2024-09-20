import styled from "styled-components";
import { getBorderRadius, getColorWithAlpha, getSize } from "~/helpers/style";
import { HexColorPicker } from "react-colorful";
import { UIFlexProps } from "~/types/style";

interface IColorPicker extends UIFlexProps {
  width?: number;
  height?: number;
  offset: number;
}

export const ColorPickerWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;

  & label {
    margin-right: ${getSize(1.2)};
  }
`;

export const ColorPicker = styled(HexColorPicker)<IColorPicker>`
  bottom: ${({ offset }) => getSize(offset)};
  left: 50%;
  transform: translateX(-50%);

  .react-colorful& {
    position: absolute;
    width: ${({ width }) => getSize(width || 15)};
    height: ${({ height }) => getSize(height || 15)};
  }
`;

export const Button = styled.button<UIFlexProps>`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: ${getSize(13.5)};
  font-size: ${getSize(1.6)};
  background-color: ${getColorWithAlpha("black300", 0.06)};
  width: auto;
  padding: 0 ${getSize(1.8)} 0 ${getSize(0.6)};
  height: ${getSize(4)};
  border: none;
  border-radius: ${getBorderRadius(3)};
  cursor: pointer;
  transition: 0.1s ease-in-out filter;
  vertical-align: middle;
  line-height: 1.1;

  &:before {
    content: "";
    display: inline-block;
    width: ${getSize(3.2)};
    height: ${getSize(3.2)};
    background-color: ${({ color }) => color};
    border-radius: 50%;
    margin-right: ${getSize(0.8)};
  }

  &:hover {
    background-color: ${getColorWithAlpha("black300", 0.15)};
  }

  &:active {
    filter: brightness(0.9);
  }
`;

export const Circle = styled.div<UIFlexProps>`
  display: inline-block;
  width: ${({ width }) => getSize(width || 3.2)};
  height: ${({ width }) => getSize(width || 3.2)};
  background-color: ${({ color }) => color};
  border-radius: 50%;
  cursor: pointer;
`;
