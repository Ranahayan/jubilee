import React from "react";
import { UIFlexProps } from "~/types/style";
import * as S from "./styles";

interface Props extends UIFlexProps {
  children: React.ReactNode;
}

const PageTitle = ({ children, ...rest }: Props) => {
  return (
    <S.PageTitleWrapper {...rest}>
      <S.PageTitle {...rest}>{children}</S.PageTitle>
    </S.PageTitleWrapper>
  );
};

export default PageTitle;
