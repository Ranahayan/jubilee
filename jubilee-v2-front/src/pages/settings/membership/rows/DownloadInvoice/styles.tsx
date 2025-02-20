import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getSize } from "~/helpers/style";

export const FlexContainerStyled = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledButton = styled(Button)`
  color: ${getColor("primary")};
  font-size: ${getSize(1.4)};
  font-weight: 400;
`;
