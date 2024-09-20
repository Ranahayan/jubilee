import styled from "styled-components";
import Text from "../Text";
import { getSize } from "~/helpers/style";

export const BrandingText = styled(Text)`
  font-size: ${getSize(1.6)};
  font-weight: 500;
  line-height: ${getSize(2.2)};
`;
