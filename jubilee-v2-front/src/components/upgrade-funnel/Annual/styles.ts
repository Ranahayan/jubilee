import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const IconContainer = styled.div`
  border: solid ${getSize(0.8)} #ecfdf3;
  background-color: #d1fadf;
  width: ${getSize(6.4)};
  height: ${getSize(6.4)};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
`;

export const Title = styled.h1`
  font-weight: 700;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(2.8)};
  margin: 0;
`;

export const Description = styled.p`
  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.4)};
  color: ${getColor("textSecondary")};
  text-align: center;
  max-width: 80%;
  margin: 0;
`;

export const FeaturesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: ${getSize(1.1)};

  ${responsive("tablet")} {
    grid-template-columns: 1fr 1fr;
  }
`;

export const FeatureText = styled.div`
  font-size: ${getSize(1.4)};
  font-weight: 400;
`;
