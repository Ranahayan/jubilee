import styled from "styled-components";
import FlexContainer from "~/components/ui/FlexContainer";
import { getSize } from "~/helpers/style";

export const Header = styled(FlexContainer)`
  margin-top: ${getSize(1.2)};
`;
