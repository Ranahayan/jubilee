import styled from "styled-components";
import { getColor } from "~/helpers/style";

type FontAwesomeIconWrapperProps = {
  color?: string;
  transform?: string;
};

export const FontAwesomeIconWrapper = styled.div<FontAwesomeIconWrapperProps>`
  color: ${({ color }) => color && getColor(color)};
  transform: ${({ transform }) => transform || "none"};
`;
