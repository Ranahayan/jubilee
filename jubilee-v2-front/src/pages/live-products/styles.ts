import styled from "styled-components";
import FlexContainer from "~/components/ui/FlexContainer";
import { getSize, responsive } from "~/helpers/style";

export const PulseIcon = styled.div`
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  animation: pulse 0.8s infinite;
`;

export const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: ${getSize(2.4)};
  margin-top: ${getSize(2.0)};

  ${responsive("desktop")} {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  ${responsive("tablet")} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const Header = styled(FlexContainer)`
  margin-top: ${getSize(1.2)};
`;

export const ProductsContainerSkeleton = styled.div`
  .skeleton-container {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    grid-gap: ${getSize(2.4)};
    margin-top: ${getSize(2.0)};

    ${responsive("desktop")} {
      grid-template-columns: repeat(4, 1fr) !important;
    }

    ${responsive("tablet")} {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .skeleton {
    border-radius: ${getSize(0.6)};
    height: ${getSize(36.0)};
    width: 100%;
  }
`;
