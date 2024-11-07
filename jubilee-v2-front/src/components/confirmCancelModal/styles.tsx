import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const ConfirmCancelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${getSize(1.2)};
  align-items: center;
`;

export const Title = styled.h1`
  font-size: ${getSize(2.0)};
  font-weight: 600;
  color: ${getColor("text")};
`;

export const SubTitle = styled.h2`
  color: ${getColor("text")};
  font-weight: 500;
  font-size: ${getSize(1.6)};
`;

export const CancelText = styled.span`
  color: ${getColor("textSecondary")};
  font-weight: 500;
  font-size: ${getSize(1.4)};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const CancelImg = styled.img`
  width: 100%;

  ${responsive("laptop")} {
    width: auto;
  }
`;
