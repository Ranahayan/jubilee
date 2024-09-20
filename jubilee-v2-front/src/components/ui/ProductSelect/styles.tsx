import styled from "styled-components";
import {
  getColor,
  getColorWithAlpha,
  getSize,
  responsive,
} from "~/helpers/style";
import { UIProps } from "~/types/style";
import { SVG } from "../SVG";

interface ImageIconProps extends UIProps {
  width: number;
  height: number;
  src: string;
}

interface CheckboxProps extends UIProps {
  isChecked: boolean;
}

interface IWrapper extends UIProps {
  hasRate: boolean;
}

const fontStyle = `
  font-size: ${getSize(1.5)};
  line-height: 180%;
`;

export const SelectWrapper = styled.div<IWrapper>`
  display: flex;
  flex-direction: row;
  width: 100%;

  & > div {
    width: 100%;
  }

  & .react-select__placeholder {
    color: ${getColor("textSecondary")};
    ${fontStyle}
  }

  & .react-select__control {
    width: 100%;
    border-color: ${getColor("borderSecondary")};
    padding: ${getSize(1)};
    min-height: ${({ hasRate }) => (hasRate ? getSize(7.5) : getSize(6.2))};
  }

  & .react-select__control:hover {
    border-color: ${getColor("borderSecondary")};
  }

  & .react-select__multi-value__label {
    ${fontStyle}
    padding: 0 ${getSize(0.6)};
    background-color: ${getColor("background")};
  }

  & .react-select__multi-value__remove {
    background-color: ${getColor("background")};
  }

  & .react-select__single-value {
    ${fontStyle}
    color: ${getColor("text")};
  }

  & .react-select__value-container {
    display: flex;
  }

  & .react-select__option {
    ${fontStyle}

    &:active, &:hover, &--is-focused, &--is-selected {
      ${fontStyle}
      background-color: ${getColor("background")};
    }
    &--is-selected {
      color: ${getColor("primary")};
      ${fontStyle}
    }
  }

  & .react-select__menu {
    z-index: 3;
  }
`;

export const SelectIcon = styled(SVG)`
  padding: 0 ${getSize(0.5)} 0 ${getSize(1.5)};
  color: ${getColor("black300")};
`;

export const ImageIcon = styled.div<ImageIconProps>`
  display: inline-block;
  width: ${({ width }) => getSize(width)};
  height: ${({ height }) => getSize(height)};
  min-width: ${({ width }) => getSize(width)};
  min-height: ${({ height }) => getSize(height)};
  background-image: url(${({ src }) => src});
  background-size: cover;
  margin-left: ${getSize(1)};
  border-radius: ${getSize(0.5)};
  border: 1px solid ${getColor("borderSecondary")};
  overflow: hidden;
`;

export const Option = styled.div<UIProps>`
  display: flex;
  flex-direction: row;
  cursor: pointer;
  padding: ${getSize(1)};
  align-items: center;

  &:hover {
    background-color: ${getColorWithAlpha("black300", 0.06)};
  }
`;

export const OptionContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: ${getSize(1.2)};

  label {
    font-size: ${getSize(1.4)};
    font-weight: 500;
    cursor: pointer;

    ${responsive("tablet")} {
      font-size: ${getSize(1.6)};
    }
  }
`;

export const Reviews = styled.div`
  display: flex;
  flex-direction: row;
  font-weight: 600;
  font-size: ${getSize(1.4)};
  gap: 5px;

  * svg {
    color: ${getColor("warning")};
  }

  & span {
    font-weight: 400;
    color: ${getColor("textSecondary")};
  }
`;

export const MenuHeader = styled.div`
  display: flex;
  font-size: ${getSize(1.6)};
  font-weight: 600;
  padding: ${getSize(1)} ${getSize(2)};
  border-bottom: 1px solid ${getColor("borderSecondary")};
  cursor: default;
`;

export const Checkbox = styled.div<CheckboxProps>`
  width: ${getSize(1.8)};
  height: ${getSize(1.8)};
  display: none;
  background-color: ${({ isChecked }) =>
    getColor(isChecked ? "primary" : "white")};
  margin-left: ${getSize(1.2)};
  border-radius: 50%;
  border: 3px solid #fff;
  outline: 1px solid
    ${({ isChecked }) =>
      isChecked ? getColor("primary") : getColorWithAlpha("black300", 0.3)};
  box-sizing: border-box;

  ${responsive("tablet")} {
    display: block;
  }
`;
