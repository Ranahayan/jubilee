import styled from "styled-components";
import { getColor, getProperty, getPxSize, getSize } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

interface StyledSeparatorProps extends UIFlexProps {
  margin?: string | number;
}

export const VerticalSeparator = styled.div<StyledSeparatorProps>`
  display: flex;
  align-self: stretch;
  flex-grow: 1;
  width: 1px !important;
  max-width: 1px;
  box-sizing: border-box;
  padding: ${(props) => getPxSize(props.padding, "1px")} 0;
  margin: 0 ${(props) => getSize(getProperty("margin", 0)(props))};

  &:before {
    content: "";
    width: 100%; /* Herda a largura do pai */
    height: calc(100% - ${(props) => getPxSize(props.padding, "0px")} * 2);
    margin: ${(props) => getPxSize(props.padding, "0px")} 0;
    background-color: ${getColor("borderSecondary")};
  }
`;

export const HorizontalSeparator = styled.div<StyledSeparatorProps>`
  display: block;
  width: 100%;
  height: 1px;
  margin: ${(props) => getSize(getProperty("margin", 0)(props))} 0;
  background-color: ${getColor("borderSecondary")};
`;
