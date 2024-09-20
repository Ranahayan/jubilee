import React from "react";
import { UIFlexProps } from "~/types/style";
import * as S from "./styles";

export interface IButtonProps
  extends UIFlexProps,
    React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  long?: boolean;
  type?: "button" | "submit" | "reset";
  outline?: boolean;
  isDisabled?: boolean;
}

const Button: React.FC<IButtonProps> = (props) => {
  const { children, ...rest } = props;
  return (
    <S.Button {...rest}>
      <div>{children}</div> {/** This div is needed to center the content */}
    </S.Button>
  );
};

export default Button;
