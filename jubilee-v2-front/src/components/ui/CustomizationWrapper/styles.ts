import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import Text from "../Text";
import Container from "../Container";

export const BackButton = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  font-weight: 500;
  font-size: ${getSize(1.8)};
  color: ${getColor("text")};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const StyledContainer = styled(Container)`
  flex-direction: column;
  max-width: ${getSize(54.5)};
  width: 100%;
  background-color: transparent;
  padding: 0;
  height: 100%;
  gap: ${getSize(1.2)};

  ${responsive("laptop")} {
    width: 40%;
  }
`;

export const CustomizationContainer = styled(Container)`
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  background-color: transparent;
  flex-direction: column;
  gap: ${getSize(1.5)};

  ${responsive("laptop")} {
    flex-direction: row;
  }
`;

export const BoldText = styled(Text)`
  font-weight: 500;
  font-size: ${getSize(1.6)};
  margin-bottom: ${getSize(1.0)};
  display: flex;
  flex-direction: row;
  gap: ${getSize(1.0)};
`;
