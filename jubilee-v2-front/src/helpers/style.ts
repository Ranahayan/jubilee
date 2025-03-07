import { IThemeBreakpoints, IThemeColors } from "~/types/theme";
import { UIProps, UISize } from "~/types/style";
import { css, keyframes, StyledProps } from "styled-components";

import _get from "lodash/get";

const DEFAULT_SIZE = "lg";

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

export const getProperty =
  (propertyKey: string, defaultValue?: any) =>
  (props: UIProps): any => {
    const value = _get(props, propertyKey);
    if (value || value == 0) return value;
    return defaultValue;
  };

export const convertUISizeToREMMultiplier = (size?: UISize): number => {
  // 1rem = 16px
  switch (size) {
    case "xs":
      return 0.25;
    case "sm":
      return 0.375;
    case "md":
      return 0.5;
    case "lg":
      return 0.625;
    case "xl":
      return 0.75;
    case "xxl":
      return 1;
    case "xxxl":
      return 1.5;
    default:
      return convertUISizeToREMMultiplier(DEFAULT_SIZE);
  }
};

export const getREM = (value: number, multiplier: number): number =>
  value * multiplier;

export const getSizeInRem = (value: number, size?: UISize): string => {
  const remMultiplier = convertUISizeToREMMultiplier(size);
  const rem = getREM(value, remMultiplier);
  return `${rem}rem`; // 1rem = 16px
};

export const getSize =
  (value: number | string) =>
  ({ size }: { size?: UISize }) => {
    if (+value != value) return value;
    return getSizeInRem(+value, size || DEFAULT_SIZE);
  };

export const getColor =
  (specificColor?: keyof IThemeColors | string, propertyKey?: keyof UIProps) =>
  (props: StyledProps<UIProps>) => {
    if (propertyKey) {
      const propColor = getProperty(propertyKey)(props);
      const themeColor = props.theme.colors?.[propColor];
      if (themeColor) return themeColor;
      if (propColor) return propColor;
    }
    if (specificColor) {
      if (props.theme.colors[specificColor])
        return props.theme.colors[specificColor];
      return specificColor;
    }
    if (props.color) return props.theme.colors[props.color];
    return props.theme.colors.primary;
  };

export const getColorWithAlpha = (color: string, opacity: number) => {
  if (opacity < 0 || opacity > 1) {
    throw new Error(
      "Opacity must be between 0 and 1, where 1 represents 100%."
    );
  }
  return (props: StyledProps<UIProps>) => {
    const hexColor = getColor(color)(props);
    const opacityHex = Math.round(opacity * 255)
      .toString(16)
      .toUpperCase();
    const paddedOpacityHex =
      opacityHex.length === 1 ? "0" + opacityHex : opacityHex;
    return hexColor + paddedOpacityHex;
  };
};

export const getShadow =
  (shadowSize?: UISize) =>
  ({ shadow, flat, theme }: StyledProps<UIProps>) => {
    if (flat) return "none";
    if (shadowSize) return theme.shadows[shadowSize];
    if (shadow) return theme.shadows[shadow];
    return "none";
  };

export const getBorderRadius =
  (borderRadiusSize = 1) =>
  ({ round, radius, ...rest }: UIProps) => {
    if (round) return "50px";
    if (radius) return getSize(radius)(rest);
    return getSize(borderRadiusSize)(rest);
  };

export const responsive =
  (device: keyof IThemeBreakpoints, isBasedOnMaxWidth?: boolean) =>
  ({ theme }: StyledProps<UIProps>) => {
    if (isBasedOnMaxWidth) {
      return `@media (max-width: ${theme.breakpoints[device]})`;
    }
    return `@media (min-width: ${theme.breakpoints[device]})`;
  };

export const getFadeInAnimation = (delay = 0) => {
  return css`
    opacity: 0;
    animation: ${fadeIn} ease-in-out ${delay}s forwards;
  `;
};

export const getFontWeight =
  (fontWeight = 400) =>
  ({ bold }: UIProps) => {
    if (bold) return 600;
    return fontWeight;
  };

export const getPxSize = (
  prop?: string | number,
  fallback?: string
): string => {
  if (!prop) return fallback ?? "0px";
  return typeof prop === "string" ? prop : `${prop}px`;
};
