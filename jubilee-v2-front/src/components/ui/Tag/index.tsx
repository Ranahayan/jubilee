import { SVG } from "../SVG";
import { SVGIcon } from "../SVG/types";
import Text from "../Text";

import * as S from "./styles";

type Props = {
  name: string;
  icon: SVGIcon;
  onClick?: (name: string) => void;
}

export const Tag = ({ name, icon, onClick }: Props) => {
  const handleClick = () => {
    if (onClick) {
      onClick(name);
    }
  };

  return (
    <S.TagContainer onClick={handleClick}>
      <Text secondary>{name}</Text>
      <SVG icon={icon} color="textSecondary" />
    </S.TagContainer>
  )
}