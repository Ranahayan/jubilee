import {
  IThemeColors,
  ITheme,
  IThemeBreakpoints,
  ThemeShadows,
} from "~/types/theme";

interface IColors extends IThemeColors {
  sidebarBorder: string;
  sidebarSectionTitle: string;
  textDisabled: string;
}

export const colors: IColors = {
  background: "#FAFBFB",
  backgroundSecondary: "#ffffff",
  text: "#080E28",
  textSecondary: "#8381A6",
  primary: "#db5f7a",
  primaryLight: "#fbeff2",
  secondary: "#4B5B72",
  gradient: "#ffff",
  disabled: "#e0e0e0",
  errorDark: "#6E0000",
  error: "#FD5757",
  errorLight: "#FFD9D9",
  successDark: "#00A52E",
  success: "#00B815",
  successLight: "#E5F7EA",
  warningDark: "#784701",
  warning: "#ff9800",
  warningLight: "#FFEDD4",
  infoDark: "#004A85",
  info: "#2196f3",
  infoLight: "#CAE5FC",
  sidebar: "#ffffff",
  sidebarBorder: "#4B5B7226",
  sidebarSectionTitle: "#9F9F9F",
  border: "#dfdfdf",
  borderSecondary: "#EEF2F6",
  white: "#ffffff",
  red: "#FD5757",
  redSecondary: "#FFEBEE",
  redDark: "#A72F2F",
  green: "#00B815",
  greenSecondary: "#E8F5E9",
  greenDark: "#01A42F",
  yellow: "rgba(134, 110, 66, 1)",
  yellowSecondary: "#FFFDE7",
  black300: "#4B5B72",
  textDisabled: "#6A6A6A",
  orange: "#F46036",
  orangeSecondary: "#FEEFEB",
  cyanDark: "#048A81",
  blueDeep: "#000944",
};

export const shadows: ThemeShadows = {
  xs: "0 0 0 1px rgba(0, 0, 0, 0.05)",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  xxl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  xxxl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

export const breakpoints: IThemeBreakpoints = {
  mobileS: "320px",
  mobileM: "375px",
  mobileL: "425px",
  tablet: "768px",
  laptop: "1024px",
  laptopL: "1367px",
  desktop: "1440px",
  desktopL: "1536px",
};

const theme: ITheme = {
  colors,
  shadows,
  breakpoints,
};

export default theme;
