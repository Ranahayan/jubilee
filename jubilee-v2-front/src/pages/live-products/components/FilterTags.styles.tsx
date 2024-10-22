import styled from "styled-components";
import FlexContainer from "~/components/ui/FlexContainer";
import { getColor, getSize } from "~/helpers/style";

export const FilterTagContent = styled.div`
  border-radius: ${getSize(0.8)};
  padding: ${getSize(0.6)} ${getSize(1.6)};
  border: 1px solid ${getColor("border")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${getSize(1.3)};
  color: ${getColor("text")};
  font-weight: 500;
`;

export const FilterTagContainer = styled(FlexContainer)`
  margin-top: ${getSize(1.6)};
`;
