import Container from "../Container";
import * as S from "./styles";

type Props = {
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  checked?: boolean;
  disabled?: boolean;
};

const CustomCheckbox = ({ onChange, checked, label, disabled }: Props) => {
  return (
    <Container padding="0" gap={1} flat>
      <S.CheckboxWrapper className={disabled ? "disabled" : ""}>
        <S.CheckboxInput
          type="checkbox"
          onChange={onChange}
          checked={checked}
          disabled={disabled}
        />
        <S.Checkmark>
          <S.CheckmarkTick />
        </S.Checkmark>
      </S.CheckboxWrapper>
      {label && <S.CheckboxLabel>{label}</S.CheckboxLabel>}
    </Container>
  );
};

export default CustomCheckbox;
