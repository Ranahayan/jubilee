import React from "react";
import * as S from "./styles";

const Text = ({ children, ...rest }: S.TextProps) => {
  return <S.Text {...rest}>{children}</S.Text>;
};

export default Text;
