import styled from "styled-components";
import Text from "~/components/ui/Text";
import { getColor } from "~/helpers/style";

export const TextStyled = styled.span`
  &.positive {
    color: ${getColor("green")};
  }

  &.negative {
    color: ${getColor("red")};
  }
`;
