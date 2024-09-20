import styled from "styled-components";
import FlexContainer from "~/components/ui/FlexContainer";
import { getSize } from "~/helpers/style";

export const FlexContainerRelative = styled(FlexContainer)`
  position: relative;
`;

export const AbsoluteIcon = styled.div`
  position: absolute;
  left: ${getSize(1.6)};
`;

export const AbsoluteButtonContainer = styled.div`
  position: absolute;
  right: ${getSize(0.9)};
`;
