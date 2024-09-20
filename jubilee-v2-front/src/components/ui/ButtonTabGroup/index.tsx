import { UIFlexProps } from "~/types/style";
import { IButtonTabProps } from "~/types/buttonTabs";
import * as S from "./styles";
import { useTranslation } from "react-i18next";

interface IButtonTabGroupProps extends UIFlexProps {
  tabs: IButtonTabProps[];
  value: IButtonTabProps;
  fillWidth?: boolean;
  onChange?: (tab: IButtonTabProps) => void;
  isDisabled?: boolean;
}

const ButtonTabGroup = ({
  tabs,
  value,
  fillWidth = true,
  onChange,
  ...rest
}: IButtonTabGroupProps) => {
  const { t } = useTranslation();

  return (
    <S.Container {...rest}>
      {tabs.map((tab) => {
        return (
          <S.Button
            key={tab.labelKey}
            fillWidth={fillWidth}
            isDisabled={tab.isDisabled}
            isActive={tab.labelKey == value.labelKey}
            onClick={() => onChange && onChange(tab)}>
            {t(tab.labelKey)}
          </S.Button>
        );
      })}
    </S.Container>
  );
};

export default ButtonTabGroup;
