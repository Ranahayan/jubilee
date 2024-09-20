import { SVG } from "../SVG"
import { SVGIcon } from "../SVG/types"

import * as S from "./styles";

type Props = {
  text: string | any,
  color: string;
  bgColor: string;
  icon: SVGIcon;
};

export const AlertMessage = ({ text, color, icon, bgColor }: Props) => {
  return (
    <S.AlertContent color={color} bgColor={bgColor}>
      <SVG icon={icon} color={color} />
      <S.AlertTitle>{text}</S.AlertTitle>
    </S.AlertContent>
  );
};
