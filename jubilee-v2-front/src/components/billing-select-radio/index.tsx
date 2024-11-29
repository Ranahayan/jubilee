import React from "react";
import * as S from "./BillingSelectRadio.style";
import RadioButton from "~/components/ui/Radio";
import Container from "~/components/ui/Container";

type Props = {
  onClick?: () => void;
  isActive?: boolean;
  label?: React.ReactNode;
  description?: string;
  image?: string;
};

export const BillingSelectRadio = ({
  onClick,
  isActive,
  label,
  description,
}: Props) => {
  return (
    <S.BillingSelectContainer isActive={isActive} onClick={onClick}>
      <RadioButton checked={isActive} onChange={onClick} />
      <Container
        flat
        padding="0"
        gap={0.25}
        bgColor="transparent"
        width="100%"
        flexDirection="column"
        alignItems="flex-start">
        <S.Title>{label}</S.Title>
        <S.Description>{description}</S.Description>
      </Container>
    </S.BillingSelectContainer>
  );
};
