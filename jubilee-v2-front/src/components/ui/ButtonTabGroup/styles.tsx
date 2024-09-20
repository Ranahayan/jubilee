import styled, { css } from "styled-components";
import { getColor, getColorWithAlpha, getSize } from "~/helpers/style";
import DefaultButton, { IButtonProps } from "../Button";
import { UIFlexProps } from "~/types/style";

interface IButton extends IButtonProps {
  isActive: boolean;
  fillWidth: boolean;
}

export const Container = styled.div<UIFlexProps>`
  background-color: ${getColorWithAlpha("black300", 0.06)};
  padding: ${getSize(0.6)};
  border-radius: ${getSize(0.6)};
  display: flex;
  flex-direction: row;
  gap: ${getSize(1.4)};
  width: 100%;
  overflow-x: auto;
`;

export const Button = styled(DefaultButton)<IButton>`
  flex: ${({ fillWidth }) => (fillWidth ? "1" : "")};
  font-size: ${getSize(1.6)};
  font-weight: 500;
  padding: ${getSize(1.4)};
  color: ${({ isActive }) => (isActive ? "white" : "")};
  background-color: ${({ isActive }) =>
    isActive ? getColor("primary") : "transparent"};
  ${({ isDisabled }) =>
    isDisabled &&
    css`
      opacity: 0.4;
    `}

  &:hover {
    ${({ isActive }) =>
      isActive
        ? "filter: brightness(0.95);"
        : css`
            background-color: ${getColorWithAlpha("black300", 0.1)};
          `}
  }
`;
