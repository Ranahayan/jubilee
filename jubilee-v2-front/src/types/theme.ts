import { UISize } from "./style";

export type ThemeColor = string;
export type ThemeShadows = Record<UISize, string>;

export interface IThemeColors {
  background: ThemeColor;
  backgroundSecondary: ThemeColor;
  text: ThemeColor;
  textSecondary: ThemeColor;
  primary: ThemeColor;
  gradient?: ThemeColor;
  primaryLight: ThemeColor;
  secondary: ThemeColor;
  disabled: ThemeColor;
  errorDark: ThemeColor;
  error: ThemeColor;
  errorLight: ThemeColor;
  successDark: ThemeColor;
  success: ThemeColor;
  successLight: ThemeColor;
  warningDark: ThemeColor;
  warning: ThemeColor;
  warningLight: ThemeColor;
  infoDark: ThemeColor;
  info: ThemeColor;
  infoLight: ThemeColor;
  sidebar: ThemeColor;
  border: ThemeColor;
  borderSecondary: ThemeColor;
  white: ThemeColor;
  red: ThemeColor;
  redSecondary: ThemeColor;
  redDark: ThemeColor;
  green: ThemeColor;
  greenSecondary: ThemeColor;
  greenDark: ThemeColor;
  yellow: ThemeColor;
  yellowSecondary: ThemeColor;
  black300?: ThemeColor;
  purple?: ThemeColor;
  purpleLight?: ThemeColor;
  orange?: ThemeColor;
  orangeSecondary?: ThemeColor;
  cyanDark: ThemeColor;
  blueDeep: ThemeColor;
}

export interface IThemeBreakpoints {
  mobileS: string;
  mobileM: string;
  mobileL: string;
  tablet: string;
  laptop: string;
  laptopL?: string;
  desktop: string;
  desktopL: string;
}

export interface ITheme {
  colors: IThemeColors;
  shadows: ThemeShadows;
  breakpoints: IThemeBreakpoints;
}
