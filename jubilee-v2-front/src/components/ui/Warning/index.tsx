import { faCircleExclamation } from "@fortawesome/pro-solid-svg-icons"
import { SVG } from "../SVG"
import { SVGIcon } from "../SVG/types"

import * as S from "./styles";

type Props = {
  text: string
};

export const Warning = ({ text }: Props) => {
  return (
    <S.WarningContent>
      <SVG icon={faCircleExclamation as SVGIcon} color="#866E42" />
      <S.WarningTitle>{text}</S.WarningTitle>
    </S.WarningContent>
  );
};
