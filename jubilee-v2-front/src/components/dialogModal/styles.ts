import styled from "styled-components";
import Text from "~/components/ui/Text";
import { getColor, getSize } from "~/helpers/style";

export const CenteredText = styled(Text)`
  text-align: center;
`;

export const ModalTitle = styled(Text)`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  color: ${getColor("text")};
`;

export const ModalDescription = styled(Text)`
  font-size: ${getSize(1.4)};
  color: ${getColor("textSecondary")};
`;

export const IconContainer = styled.div`
  padding: ${getSize(1.4)};
  border-radius: 50%;
  background-color: ${getColor("primaryLight")};

  svg {
    color: ${getColor("primary")};
  }
`;
