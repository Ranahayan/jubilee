import { faCrown } from "@fortawesome/pro-solid-svg-icons";
import Container from "../Container";
import FlexContainer from "../FlexContainer";
import { SVG } from "../SVG";
import { SVGIcon } from "../SVG/types";
import CustomCheckbox from "../Checkbox";
import * as S from "./styles";
import { Warning } from "../Warning"
import Button from "../Button"
import { useTranslation } from "react-i18next"
import { Fragment } from "react"

type Props = {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  title: string;
  label: string;
  warningText: string;
  onClick: () => void;
  padding?: number | string;
};

export const RemoveBranding = ({
  checked = false,
  onChange,
  disabled,
  title,
  label,
  warningText,
  onClick,
  padding,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Container
      flat
      gap={1.6}
      flexDirection="column"
      alignItems="flex-start"
      padding={padding}
    >
      <FlexContainer>
        <SVG icon={faCrown as SVGIcon} color="#FFA41C" />
        <S.BrandingText>{title}</S.BrandingText>
      </FlexContainer>
      <CustomCheckbox
        label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {!checked && disabled && <Fragment> 
        <Warning text={warningText} />
        <Button
          color="white"
          bgColor="green"
          width="100%"
          children={t("connect.try")}
          onClick={onClick}
        />
      </Fragment>}
    </Container>
  );
};
