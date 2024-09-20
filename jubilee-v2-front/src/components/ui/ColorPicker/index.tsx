import { useState, useRef, useMemo, ReactNode } from "react";
import useClickOutside from "~/hooks/useClickOutside";
import * as S from "./styles";

interface IButtonProps {
  children?: ReactNode;
  isDisabled?: boolean;
  value?: string;
  onChange?: (color: string) => void;
  pickerWidth?: number;
  pickerHeight?: number;
  short?: boolean;
  width?: number; // only valid when short is enabled
}

const ColorPicker = ({
  children,
  value,
  onChange,
  width,
  pickerWidth,
  pickerHeight,
  short,
  isDisabled,
}: IButtonProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  useClickOutside(colorPickerRef, () => {
    setShowColorPicker(false);
  });

  const colorpicker = useMemo(() => {
    if (!showColorPicker) return null;

    return (
      <div ref={colorPickerRef}>
        <S.ColorPicker
          color={value}
          onChange={(color) => onChange && onChange(color)}
          offset={short ? (width || 3.2) + 0.6 : 4.6}
          width={pickerWidth}
          height={pickerHeight}
        />
      </div>
    );
  }, [showColorPicker, value]);

  if (short) {
    return (
      <S.ColorPickerWrapper>
        <S.Circle
          width={width}
          color={value}
          onClick={() => !isDisabled && setShowColorPicker(!showColorPicker)}
        />
        {colorpicker}
      </S.ColorPickerWrapper>
    );
  }

  return (
    <S.ColorPickerWrapper>
      {children && <label>{children}</label>}
      <S.Button
        color={value}
        disabled={isDisabled}
        onClick={() => setShowColorPicker(!showColorPicker)}>
        {value}
      </S.Button>
      {colorpicker}
    </S.ColorPickerWrapper>
  );
};

export default ColorPicker;
