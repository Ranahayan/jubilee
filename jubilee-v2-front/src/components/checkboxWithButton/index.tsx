import { useState } from "react";
import * as S from "./styles";

interface CheckboxWithButtonProps {
  initialValue?: boolean;
  label: string;
  buttonLabel: string;
  onToggle: (value: boolean) => void;
  onClick: () => void;
  isDisabled?: boolean;
}

export const CheckboxWithButton = ({
  initialValue = false,
  label,
  buttonLabel,
  onToggle,
  onClick,
  isDisabled
}: CheckboxWithButtonProps) => {
  const [checked, setChecked] = useState(initialValue);
  
  const handleToggle = () => {
    setChecked(!checked);
    onToggle(!checked);
  };

  return (
    <S.Container>
      <S.Checkbox>
        <input
          checked={checked}
          onChange={handleToggle}
          type="checkbox"
        />
        {label}
      </S.Checkbox>
      <S.Button disabled={isDisabled} onClick={onClick}>{buttonLabel}</S.Button>
    </S.Container>
  );
}