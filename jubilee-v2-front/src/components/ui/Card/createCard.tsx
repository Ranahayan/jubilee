import { Fragment } from "react";
import { SVGIcon } from "../SVG/types";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "../SVG";

import * as S from "./styles";

type Props = {
  title: string;
  onClick?: () => void;
}

export const CreateCard = ({ title, onClick }: Props) => {
  return (
    <Fragment>
      <S.IconContainer onClick={onClick}>
        <SVG icon={faPlus as SVGIcon} size="xl" color="primary"/>
      </S.IconContainer>

      <S.StyledText>{title}</S.StyledText>
    </Fragment>
  )
}