import { CountdownProps } from "react-countdown";
import { UIProps } from "./style";
import { DefaultTFuncReturn } from "i18next";

export interface ICountdownTimerProps
  extends Omit<CountdownProps, "date">,
    ICountdownStyle {
  targetDate: Date;
  dots?: boolean;
  callback?: Function;
  hoursKey?: DefaultTFuncReturn;
  minutesKey?: DefaultTFuncReturn;
  secondsKey?: DefaultTFuncReturn;
  keysOutside?: boolean;
  showHours?: boolean;
}

export interface ICountdownNumberProps extends ICountdownStyle {
  value: number;
  label?: DefaultTFuncReturn;
}

export interface ICountdownStyle extends UIProps {
  bgColor?: string;
  numberColor?: string;
  textColor?: string;
  textWeight?: number;
  width?: string;
  height?: string;
  numberSize?: string;
  textSize?: string;
  gap?: number;
  lineHeight?: number;
  borderColor?: string;
  dotsColor?: string;
  dotsHeight?: number;
  keysOutside?: boolean;
  numberContainerWidth?: string;
}
