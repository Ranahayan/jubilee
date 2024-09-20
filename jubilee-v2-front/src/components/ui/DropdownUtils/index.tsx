import { IDropdownItem } from "~/types/dropdown";
import * as S from "./styles";
import { SVG } from "../SVG";

type Props = {
  items: IDropdownItem[];
};

export const DropdownUtils = ({ items }: Props) => {
  return (
    <S.DropdownContainer>
      {items.map((item, index) => (
        <S.DropdownItem key={index} onClick={item.onClick}>
          <SVG icon={item.icon} />
          <S.Text>{item.name}</S.Text>
        </S.DropdownItem>
      ))}
    </S.DropdownContainer>
  );
};
