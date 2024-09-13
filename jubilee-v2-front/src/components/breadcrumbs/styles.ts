import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(0.6)};
`;

interface IBreadcrumbButton {
  isHighlighted?: boolean;
}

export const BreadcrumbButton = styled(Button)<IBreadcrumbButton>`
  background-color: transparent;
  font-size: ${getSize(1.4)};
  line-height: 1.1;
  font-weight: ${({ isHighlighted }) => (isHighlighted ? 500 : 400)};
  color: ${({ isHighlighted }) =>
    getColor(isHighlighted ? "text" : "textSecondary")};
  padding: ${getSize(0.6)};
  margin: 0;

  &:hover {
    background-color: ${getColor("primary")}10;
  }
`;

interface IBreadcrumbText extends UIProps {
  isHighlighted?: boolean;
}

export const BreadcrumbText = styled.span<IBreadcrumbText>`
  font-size: ${getSize(1.4)};
  line-height: 1.1;
  font-weight: ${({ isHighlighted }) => (isHighlighted ? 500 : 400)};
  color: ${({ isHighlighted }) =>
    getColor(isHighlighted ? "text" : "textSecondary")};

  padding: ${getSize(0.6)};
  margin: 0;
`;
