import { SVGIcon } from "../SVG/types";
import { SVG } from "../SVG";
import FlexContainer from "../FlexContainer";
import Button from "../Button";
import Modal from "../Modal";
import Label from "../Label";

import * as S from "./styles";

type Props = {
  isShowing: boolean;
  hide: () => void;
  handleAction: () => void;
  title: string;
  buttonColor: string;
  buttonText: string;
  buttonCancelText: string;
  description: string;
  icon?: SVGIcon;
  id?: string;
};

export const DialogModal = ({
  isShowing,
  hide,
  handleAction,
  title,
  buttonColor,
  buttonText,
  buttonCancelText,
  description,
  icon,
  id,
}: Props) => {
  const handleActionAndClose = () => {
    handleAction();
    hide();
  };

  return (
    <Modal id={id} isShowing={isShowing} hide={hide} padding="32px" minWidth="20%">
      <FlexContainer flexDirection="column" gap={1.6}>
        {icon ? <SVG icon={icon} size="2xl" color="primary" /> : null}
        <FlexContainer width="260px" padding={0}>
          <Label text={title} alignItems="center">
            <S.CenteredText secondary>{description}</S.CenteredText>
          </Label>
        </FlexContainer>
        <Button
          color="white"
          bgColor={buttonColor}
          children={buttonText}
          onClick={handleActionAndClose}
          size="lg"
          width="40%"
          alignSelf="center"
        />
        <Button
          color="secondary"
          bgColor="white"
          children={buttonCancelText}
          onClick={hide}
          width="40%"
          size="lg"
          alignSelf="center"
        />
      </FlexContainer>
    </Modal>
  );
};
