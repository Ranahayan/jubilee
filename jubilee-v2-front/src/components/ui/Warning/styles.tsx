import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const WarningContent = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  color: ${getColor("yellow")};
  background-color: ${getColor("yellowSecondary")};
  padding: ${getSize(1.2)} ${getSize(1.0)};
  border-radius: ${getSize(0.6)};
`;

export const WarningTitle = styled.span`
  font-size: ${getSize(1.5)};
`;
