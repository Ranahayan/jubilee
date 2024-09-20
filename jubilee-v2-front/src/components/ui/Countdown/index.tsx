import Countdown, { zeroPad } from "react-countdown";
import * as S from "./styles";
import FlexContainer from "../FlexContainer";
import { ICountdownNumberProps, ICountdownTimerProps } from "~/types/countdown";
import { useEffect, useState } from "react";
import { SVG } from "../SVG";
import { faColon } from "@fortawesome/pro-solid-svg-icons";
interface ICountdownRender {
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

const CountdownTimer = ({
  targetDate,
  bgColor,
  width,
  height,
  numberColor,
  textColor,
  numberSize,
  textSize,
  dotsHeight,
  gap,
  dots,
  lineHeight,
  callback,
  hoursKey,
  minutesKey,
  secondsKey,
  keysOutside,
  dotsColor,
  borderColor,
  showHours,
  numberContainerWidth,
  ...countdownProps
}: ICountdownTimerProps) => {
  const [isFinished, setIsFinished] = useState(false);
  // TODO: Remove this state and fix the freezed countdown
  const [uselessState, setUselessState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setUselessState((i) => i + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isNaN(targetDate.getTime())) return null;

  const renderer = ({
    hours,
    minutes,
    seconds,
    completed,
  }: ICountdownRender) => {
    if (completed) {
      setIsFinished(true);
      if (!isFinished) return callback ? callback() : null;
    } else {
      return (
        <FlexContainer gap={gap}>
          {showHours && (
            <>
              <NumberComponent
                value={hours}
                label={hoursKey}
                bgColor={bgColor}
                width={width}
                borderColor={borderColor}
                height={height}
                numberColor={numberColor}
                lineHeight={lineHeight}
                numberSize={numberSize}
                keysOutside={keysOutside}
                textColor={textColor}
                textSize={textSize}
                numberContainerWidth={numberContainerWidth}
              />

              {dots && (
                <S.Dots
                  dotsColor={dotsColor}
                  keysOutside={keysOutside}
                  bgColor={bgColor}
                  dotsHeight={dotsHeight}>
                  <SVG icon={faColon} />
                </S.Dots>
              )}
            </>
          )}

          <NumberComponent
            value={minutes}
            label={minutesKey}
            bgColor={bgColor}
            width={width}
            borderColor={borderColor}
            height={height}
            numberColor={numberColor}
            lineHeight={lineHeight}
            numberSize={numberSize}
            keysOutside={keysOutside}
            textColor={textColor}
            textSize={textSize}
            numberContainerWidth={numberContainerWidth}
          />

          {dots && (
            <S.Dots
              dotsColor={dotsColor}
              keysOutside={keysOutside}
              bgColor={bgColor}
              dotsHeight={dotsHeight}>
              <SVG icon={faColon} />
            </S.Dots>
          )}

          <NumberComponent
            value={seconds}
            label={secondsKey}
            bgColor={bgColor}
            width={width}
            borderColor={borderColor}
            height={height}
            numberColor={numberColor}
            lineHeight={lineHeight}
            numberSize={numberSize}
            keysOutside={keysOutside}
            textColor={textColor}
            textSize={textSize}
            numberContainerWidth={numberContainerWidth}
          />
        </FlexContainer>
      );
    }
  };

  return (
    <Countdown date={targetDate} renderer={renderer} {...countdownProps} />
  );
};

const NumberComponent = ({
  bgColor,
  width,
  borderColor,
  height,
  numberColor,
  lineHeight,
  numberSize,
  keysOutside,
  textColor,
  textSize,
  value,
  label,
  numberContainerWidth,
}: ICountdownNumberProps) => {
  return (
    <FlexContainer flexDirection="column" width={numberContainerWidth}>
      <S.CountdownContainer
        bgColor={bgColor}
        width={width}
        borderColor={borderColor}
        height={height}>
        <S.CountdownNumber
          numberColor={numberColor}
          lineHeight={lineHeight}
          numberSize={numberSize}>
          {zeroPad(value)}
        </S.CountdownNumber>
        {!keysOutside ? (
          <S.CountdownText textColor={textColor} textSize={textSize}>
            {label}
          </S.CountdownText>
        ) : null}
      </S.CountdownContainer>
      {keysOutside ? (
        <S.CountdownText textColor={textColor} textSize={textSize}>
          {label}
        </S.CountdownText>
      ) : null}
    </FlexContainer>
  );
};

export default CountdownTimer;
