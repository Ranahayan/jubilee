import { useNavigate } from "react-router-dom";
import Button from "../Button";
import Container from "../Container";
import FlexContainer from "../FlexContainer";
import * as S from "./styles";
import { SVG } from "../SVG";
import { faChevronLeft, faDownload } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "../SVG/types";
import { useTranslation } from "react-i18next";

type Props = {
  returnUrl: string;
  handleAction?: () => void;
  handleDownload?: () => void;
  disabled?: boolean;
  iconButtonSave?: SVGIcon;
};

export const Header = ({
  returnUrl,
  handleAction,
  handleDownload,
  disabled = false,
  iconButtonSave,
}: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(returnUrl);
  };

  return (
    <Container justifyContent="space-between" width="100%">
      <S.BackButton onClick={handleBack}>
        <SVG icon={faChevronLeft as SVGIcon} size="sm" />
        {t("customization.header")}
      </S.BackButton>

      <FlexContainer>
        <Button
          children={t("customization.cancel")}
          color="text"
          bgColor="primaryLight"
          padding="12px 25px"
          onClick={handleBack}
        />
        <Button
          color="white"
          bgColor="primary"
          padding="12px 21px"
          onClick={handleAction}
          isDisabled={disabled}
        >
          <FlexContainer>
            {iconButtonSave ? <SVG icon={iconButtonSave as SVGIcon} /> : null}
            {t("customization.save")}
          </FlexContainer>
        </Button>
        {!!handleDownload ?
          <Button
            color="white"
            bgColor="primary"
            padding="12px 15px"
            onClick={handleDownload}
          >
            <SVG icon={faDownload as SVGIcon} />
            {t("customization.download")}
          </Button> : null}
      </FlexContainer>
    </Container>
  );
};
