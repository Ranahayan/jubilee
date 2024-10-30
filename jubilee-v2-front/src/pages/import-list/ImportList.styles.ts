import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface Props extends UIProps {
  isHeader?: boolean;
}

export const ImageContainer = styled.div`
  background-color: ${getColor("borderSecondary")};
  border-radius: ${getSize(0.7)};
  width: 50px;
  height: 50px;

  img {
    width: 50px;
    height: 50px;
    border-radius: ${getSize(0.7)};
  }
`;

export const CellContainer = styled.div<Props>`
  min-width: ${getSize(4)};
  background-color: ${props => props.isHeader ? getColor('disabled') : getColor("white")};
`;
