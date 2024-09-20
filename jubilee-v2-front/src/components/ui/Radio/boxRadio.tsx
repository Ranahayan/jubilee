import { ISquareOption } from "~/types/squareOption";
import { SVG } from "../SVG";
import { SVGIcon } from "../SVG/types";

import * as S from "./styles";

type Props = {
  options: ISquareOption[];
  onChange?: (value: number | string) => void;
  value: number | string;
  disable?: boolean;
};

export const BoxRadio = ({
  value,
  onChange,
  options,
  disable = false,
}: Props) => {
  const handleChange = (value: number | string) => {
    onChange && onChange(value);
  };

  const getClass = (option: ISquareOption) => {
    if (disable) return "disable";
    if (value === option.value) return "active";

    return "";
  };

  return (
    <S.GridBox columnCount={options.length}>
      {options.map((option) => (
        <S.BoxContainer
          onClick={() => (disable ? null : handleChange(option.value))}
          className={getClass(option)}
          disabled={disable}>
          {option.icon && <SVG icon={option.icon as SVGIcon} size="xl" />}
          <label>{option.label}</label>
          <S.HiddenRadioButton checked={value === option.value} value={value} />
          <S.StyledRadioButton disabled={disable} />
        </S.BoxContainer>
      ))}
    </S.GridBox>
  );
};
