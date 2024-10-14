import * as S from "./styles";
import { t } from "i18next";

interface ColorPickerProps {
  color: string;
  handleColor: (color: string) => void;
  onSave: () => void;
  show: boolean;
}

const ColorPicker = ({ show, color, handleColor, onSave }: ColorPickerProps) => {
  if (!show) return null;

  return (
    <S.ColorPickerWrapper>
      <S.ColorPicker color={color} onChange={handleColor} />
      <input value={color} onChange={e => handleColor(e.target.value)} />
      <S.ColorPickerActions>
        <S.ActionButton onClick={() => handleColor("")}>
          {t('dropshipping.reset')}
        </S.ActionButton>
        <S.ActionButton onClick={onSave}>
          {t('dropshipping.save')}
        </S.ActionButton>
      </S.ColorPickerActions>
    </S.ColorPickerWrapper>
  )
}

export default ColorPicker;