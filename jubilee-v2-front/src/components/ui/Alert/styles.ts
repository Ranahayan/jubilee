import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const AlertContent = styled.div<UIProps>`
  display: flex;
  gap: ${getSize(1.0)};
  color: ${(props) => getColor(props.color)};
  background-color: ${(props) => getColor(props.bgColor)};
  padding: ${getSize(1.2)} ${getSize(1.0)};
  border-radius: ${getSize(0.6)};
  width: 100%;
`;

export const AlertTitle = styled.span`
  font-size: ${getSize(1.5)};
`;
