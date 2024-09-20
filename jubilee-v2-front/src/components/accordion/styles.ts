import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const AccordionContainer = styled.div`
  width: 100%;
  margin: ${getSize(1.0)} 0;
`;

export const AccordionHeader = styled.div`
  display: flex;
  padding: ${getSize(1.6)};
  border-radius: ${getSize(0.6)};
  width: 100%;
  justify-content: space-between;
  background-color: ${getColor("white")};
  cursor: pointer;
  font-weight: bold;
`;

interface AccordionContentProps extends UIProps {
  isOpen: boolean;
}

export const AccordionContent = styled.div<AccordionContentProps>`
  max-height: ${({ isOpen }) => (isOpen ? '400px' : '0')};
  overflow: hidden;
  transition: max-height 0.6s ease;
  background-color: ${getColor("white")};
  padding: 0 ${getSize(1.6)};
`;