import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import FlexContainer from "../FlexContainer";

export const VariantItem = styled.div`
  font-size: ${getSize(1.6)};
  color: ${getColor("text")};
  height: ${getSize(4.2)};
  width: fit-content;
  min-width: ${getSize(4.2)};
  padding: 0 ${getSize(1.0)};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${getSize(0.6)};
  font-weight: 400;
  background-color: ${getColor("borderSecondary")};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &.active {
    background-color: ${getColor("primary")};
    color: ${getColor("white")};
    font-weight: 500;
    opacity: 1;
    cursor: default;
  }
`;

export const VariantContainer = styled(FlexContainer)`
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
`;
