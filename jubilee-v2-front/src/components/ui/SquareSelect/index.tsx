import { useMemo, ReactNode } from "react";
import { ISquareOption } from "~/types/squareOption";
import { useTranslation } from "react-i18next";
import * as S from "./styles";

interface ISquareSelectProps {
  options: ISquareOption[];
  value?: ISquareOption;
  onChange?: (value: ISquareOption) => void;
  isDisabled?: boolean;
  children?: ReactNode;
  padding?: number;
  isSmall?: boolean;
}

interface ISquareButton {
  isSelected: boolean;
  label: string;
  isSmall: boolean;
  onClick?: () => void;
}

const SquareButton = ({
  isSelected,
  label,
  onClick,
  isSmall = false,
}: ISquareButton) => {
  return (
    <S.SquareButton
      onClick={onClick}
      aria-label={label}
      isSelected={isSelected}
      isSmall={isSmall}>
      {label}
    </S.SquareButton>
  );
};

const SquareSelect: React.FC<ISquareSelectProps> = ({
  children,
  options,
  value,
  isDisabled = false,
  isSmall = false,
  padding,
  onChange,
}) => {
  const { t } = useTranslation();

  const [labelItems, IconItems] = useMemo(() => {
    const labelItems = options
      .filter((option) => !option.icon)
      .map(({ label, ...option }) => (
        <SquareButton
          label={t(label || "") as string}
          isSmall={isSmall}
          isSelected={option.value === value?.value}
          onClick={() => onChange && onChange(option)}
          key={option.value}
        />
      ));

    const IconItems = options
      .filter((option) => option.icon)
      .map(({ label, icon, ...option }) => (
        <S.Square
          aria-label={t(label || "") as string}
          isSmall={isSmall}
          isSelected={option.value === value?.value}
          onClick={() => onChange && onChange(option)}
          padding={padding}
          key={option.value}
          {...option}>
          <img src={icon as string} />
        </S.Square>
      ));

    return [labelItems, IconItems];
  }, [options, value, onChange, padding]);

  return (
    <S.SquareSelect isDisabled={isDisabled}>
      {children}
      {labelItems}
      {children || labelItems.length ? <S.Divider /> : null}
      {IconItems}
    </S.SquareSelect>
  );
};

export default SquareSelect;
