// RadioButton.tsx
import React from "react";
import * as S from "./styles";
import { SVGIcon } from "../SVG/types";

export interface RadioButtonProps {
  label?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  icon?: SVGIcon;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color?: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  name,
  value,
  checked,
  onChange,
  color
}) => (
  <S.RadioButtonContainer>
    <S.HiddenRadioButton
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
    />
    <S.StyledRadioButton color={color} />
    <label>{label}</label>
  </S.RadioButtonContainer>
);

export default RadioButton;
