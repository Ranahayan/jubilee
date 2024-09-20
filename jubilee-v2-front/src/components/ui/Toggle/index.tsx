import React, { MouseEventHandler } from 'react';
import * as S from './style';

interface ToggleProps {
  value: boolean;
  onChange: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ value = false, onChange, disabled = false }) => {

  return (
    <S.ToggleContainer>
      <S.ToggleButton onClick={onChange} isOn={value} disabled={disabled}>
        <S.ToggleHandle isOn={value} />
      </S.ToggleButton>
    </S.ToggleContainer>
  );
};

export default Toggle;