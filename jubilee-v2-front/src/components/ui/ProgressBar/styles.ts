import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

// Create a styled div for the progress bar container
export const ProgressBarContainer = styled.div`
  width: 100%;
  background-color: ${getColor("background", "bgColor")};
  border-radius: ${getSize(2.2)};
`;

// Create a styled div for the progress bar itself
export const ProgressBarFill = styled.div<{ progress: number } & UIFlexProps>`
  height: ${getSize(0.8)};
  width: ${({ progress }) => progress}%;
  transition: width 0.2s ease-in-out;
  background: ${getColor(
    "linear-gradient(90deg, #1225d1 50.08%, #2b3fff 99.8%)",
    "color"
  )};
  border-radius: inherit;
  text-align: center;
  line-height: 20px;
  color: white;
`;
