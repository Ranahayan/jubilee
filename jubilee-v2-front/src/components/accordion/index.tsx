import React from "react";
import * as S from "./styles";
import { SVG } from "../ui/SVG";
import { faChevronDown, faChevronUp } from "@fortawesome/pro-solid-svg-icons";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onChange: () => void;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, open, onChange }) => {
  return (
    <S.AccordionContainer>
      <S.AccordionHeader onClick={onChange}>
        {title}
        <SVG icon={open ? faChevronUp : faChevronDown} color="secondary" />
      </S.AccordionHeader>
      <S.AccordionContent isOpen={open}>{children}</S.AccordionContent>
    </S.AccordionContainer>
  );
};

export default Accordion;
