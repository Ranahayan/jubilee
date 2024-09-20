import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { ICountdownStyle } from "~/types/countdown";

export const CountdownContainer = styled.div<ICountdownStyle>`
  display: flex;
  flex-direction: column;
  gap: -2px;
  justify-content: center;
  align-items: center;
  width: ${({ width }) => getColor(width)};
  height: ${({ height }) => getColor(height)};
  background-color: ${({ bgColor }) => getColor(bgColor)};
  border-radius: 6px;
  border: 1px solid
    ${({ borderColor }) => getColor(borderColor || "transparent")};
`;

export const CountdownNumber = styled.p<ICountdownStyle>`
  color: ${({ numberColor }) => getColor(numberColor)};
  font-size: ${({ numberSize }) => getColor(numberSize)};
  font-weight: 600;
  line-height: ${({ lineHeight }) => lineHeight};
  margin: 0;
`;

export const CountdownText = styled.span<ICountdownStyle>`
  color: ${({ textColor }) => getColor(textColor)};
  margin: 0;
  font-size: ${({ textSize }) => getColor(textSize)};
  font-weight: ${({ textWeight }) => textWeight ?? 500};
  line-height: 1;
`;

export const Dots = styled.span<ICountdownStyle>`
  color: ${({ dotsColor, bgColor }) => getColor(dotsColor || bgColor)};
  margin-bottom: ${({ keysOutside }) => (keysOutside ? getSize(1.5) : 0)};

  & svg {
    height: ${({ dotsHeight }) => getSize(dotsHeight ?? 3.5)};
  }
`;
