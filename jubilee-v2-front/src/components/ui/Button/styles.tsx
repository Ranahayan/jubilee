import styled from "styled-components";
import {
  getBorderRadius,
  getColor,
  getProperty,
  getShadow,
  getSize,
} from "~/helpers/style";
import { IButtonProps } from ".";

export const Button = styled.button<IButtonProps>`
  position: relative;
  font-size: ${(props) => getSize(getProperty("fontSize", 1.375)(props))};
  font-weight: ${getProperty("fontWeight", 400)};
  ${({ long, padding, ...rest }) =>
    padding
      ? `padding: ${getSize(padding)(rest)};`
      : long
        ? `padding: ${getSize(1.2)(rest)} ${getSize(3.5)(rest)};`
        : `padding: ${getSize(1.2)(rest)} ${getSize(1.5)(rest)};`}
  background: ${getColor("backgroundSecondary", "bgColor")};
  color: ${getColor("text", "color")};
  width: ${getProperty("width", "auto")};
  height: ${getProperty("height", "auto")};
  border: ${({ outline, ...rest }) =>
    outline ? `1px solid ${getColor("border", "borderColor")(rest)}` : "none"};
  border-radius: ${getBorderRadius(0.5)};
  cursor: pointer;
  transition: 0.1s ease-in-out filter;
  box-shadow: ${getShadow()};
  vertical-align: middle;
  line-height: 1.1;
  white-space: nowrap;
  align-self: ${getProperty("alignSelf", "flex-start")};

  & > div {
    width: 100%;
    display: flex;
    justify-content: ${getProperty("justifyContent", "center")};
    align-items: ${getProperty("alignItems", "center")};
    gap: ${(props) => getSize(getProperty("gap", 1)(props))};
  }

  ${({ isDisabled }) =>
    isDisabled && `opacity: 0.8; cursor: not-allowed; pointer-events: none;`}

  &:hover {
    filter: brightness(0.95);
  }
  &:active {
    filter: brightness(0.9);
  }
`;
