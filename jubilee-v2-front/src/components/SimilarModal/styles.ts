import styled from "styled-components";
import { getSize, responsive } from "~/helpers/style";

export const Title = styled.h2`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  margin: 0;
`;

export const SubTitle = styled.h3`
  font-size: ${getSize(1.6)};
  font-weight: 600;
`;

export const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-self: center;
  gap: ${getSize(1.0)};

  ${responsive("tablet")} {
    align-self: space-between;
    grid-template-columns: 1fr 1fr 1fr;
  }; 
`;