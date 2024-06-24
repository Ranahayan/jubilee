import { IThemeColors } from "./theme";

export type UIInputVariant = "default" | "outlined" | "filled";
export type UISize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";

export interface UIProps {
  variant?: UIInputVariant;
  size?: UISize;
  color?: keyof IThemeColors | string;
  bgColor?: keyof IThemeColors | string;
  borderColor?: keyof IThemeColors | string;
  flexDirection?: "row" | "column";
  shadow?: UISize | string;
  flat?: boolean;
  round?: boolean;
  radius?: number | string;
  padding?: number | string;
  margin?: number | string;
  width?: number | string;
  height?: number | string;
  fontWeight?: number;
  fontSize?: number | string;
  bold?: boolean;
}
export interface UIFlexProps extends UIProps {
  gap?: number | string;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  alignSelf?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "stretch"
    | "space-between"
    | "space-around";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
}
