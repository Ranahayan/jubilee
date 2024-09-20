import styled from "styled-components";
import FlexContainer from "~/components/ui/FlexContainer";
import { getColor, getSize, responsive } from "~/helpers/style";

export const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${getColor("white")};
  justify-content: space-between;
  padding: ${getSize(2.0)} ${getSize(2.4)};
  grid-column: 1 / 4;
  height: auto;
  gap: ${getSize(2.4)};

  ${responsive("laptop")} {
    grid-column: 2 / 4;
  }
`;

export const IconsContainer = styled(FlexContainer)`
  svg {
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;
