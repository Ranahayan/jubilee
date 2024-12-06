import styled from "styled-components";
import Modal from "~/components/ui/Modal";
import { getColor, getSize, responsive } from "~/helpers/style";

export const Title = styled.h1`
  font-size: ${getSize(2.2)};
  font-weight: 700;
  color: ${getColor("text")};
`;

export const CSName = styled.span`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  color: ${getColor("text")};
`;

export const DescText = styled.span`
  font-size: ${getSize(1.6)};
  color: ${getColor("text")};
`;

export const DescTextBold = styled.span`
  font-weight: 600;
`;

export const SureTitle = styled.span`
  font-size: ${getSize(1.8)};
  color: ${getColor("text")};
  font-weight: 600;
`;

export const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${getSize(1.4)};
  background-color: ${getColor("redSecondary")};
  border-radius: ${getSize(2.8)};
`;

export const StyledText = styled.span`
  font-size: ${getSize(1.4)};
  color: ${getColor("textSecondary")};
  line-height: 1.8;
`;
