import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export interface IAnchorText extends UIProps {
  textDecoration?: string;
  color?: string;
}

export const AnchorText = styled.a<IAnchorText>`
  font-size: ${getSize(1.4)};
  color: ${({ color }) => getColor(color || "primary")};
  text-decoration: ${({ textDecoration }) => textDecoration || "none"};
  cursor: pointer;
  margin: 0 ${getSize(0.2)};
`;

export const CheckboxInput = styled.input`
  margin-top: ${getSize(0.2)};
  cursor: pointer;
  min-width: ${getSize(1.6)};
  height: ${getSize(1.6)};
  accent-color: ${getColor("primary")};
`;

export const TermsText = styled.div`
  flex: 1;
  line-height: 1.4;
`;