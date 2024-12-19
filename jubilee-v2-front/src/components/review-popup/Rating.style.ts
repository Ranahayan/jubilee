import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

interface SelectedProps extends UIFlexProps {
  isSelected?: boolean;
}

export const RatingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: fit-content;
  cursor: pointer;
`;

export const RatingIconWrapper = styled.div<SelectedProps>`
  width: ${getSize(5)};
  height: ${getSize(5)};
  padding: ${getSize(0.4)};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;

  ${responsive("laptop")} {
    width: ${getSize(10)};
    height: ${getSize(10)};
  }
`;

export const Subtitle = styled.span<SelectedProps>`
  color: ${getColor("text")};
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  margin-top: ${getSize(1)};
`;
