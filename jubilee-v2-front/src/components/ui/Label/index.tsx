import React from "react";
import { UIFlexProps, UIProps } from "~/types/style";
import FlexContainer from "../FlexContainer";
import * as S from "./styles";

interface Props extends UIProps {
  text?: string | null;
  children?: React.ReactNode;
  small?: boolean;
  alignItems?: UIFlexProps["alignItems"];
  width?: UIFlexProps["width"];
  labelWidth?: UIFlexProps["width"];
  flexDirection?: UIFlexProps["flexDirection"];
  prefixComponent?: React.ReactNode;
}

const Label = ({
  text,
  children,
  alignItems,
  width,
  flexDirection,
  prefixComponent,
  ...rest
}: Props) => {
  return (
    <FlexContainer
      width="100%"
      flexDirection={flexDirection || "column"}
      alignItems={alignItems}>
      {text ? (
        <S.Label width={width} {...rest}>
          {prefixComponent}
          {text}
        </S.Label>
      ) : null}
      {children}
    </FlexContainer>
  );
};

export default Label;
