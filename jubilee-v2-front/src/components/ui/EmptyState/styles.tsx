import styled from "styled-components";
import Text from "../Text";
import { getSize } from "~/helpers/style";

export const BoldText = styled(Text)`
  font-weight: 500;
  font-size: ${getSize(1.6)};
`;
