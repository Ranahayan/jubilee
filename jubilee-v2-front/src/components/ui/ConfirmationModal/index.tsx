import { faExclamationCircle } from "@fortawesome/pro-solid-svg-icons";
import Button from "../Button";
import FlexContainer from "../FlexContainer";
import Modal from "../Modal";
import { SVG } from "../SVG";

import { SVGIcon } from "../SVG/types";
import { CenteredTitle } from "./styles";

type Props = {
  isShowing: boolean;
  hide: () => void;
  handleAction: () => void;
  title: string;
  buttonColor: string;
  buttonText: string;
  buttonCancelText: string;
  id?: string;
}

export const ConfirmationModal = ({
  isShowing,
  hide,
  handleAction,
  title,
  buttonColor,
  buttonText,
  buttonCancelText,
  id,
}: Props) => {
  const handleActionAndClose = () => {
    handleAction();
    hide();
  }

  return (
    <Modal id={id} isShowing={isShowing} hide={hide}>
      <FlexContainer flexDirection="column" gap={1.6}>
        <SVG icon={faExclamationCircle as SVGIcon} color="red" size="2xl" />
        <FlexContainer width="380px" padding={0}>
          <CenteredTitle>{title}</CenteredTitle>
        </FlexContainer>
        <Button
          color="white"
          bgColor={buttonColor}
          children={buttonText}
          onClick={handleActionAndClose}
          size="xl"
          padding="12px 34px"
          alignSelf="center"
        />
        <Button
          color="secondary"
          bgColor="white"
          children={buttonCancelText}
          onClick={hide}
          padding="12px 34px"
          size="xl"
          alignSelf="center"
        />
      </FlexContainer>
    </Modal>
  );
};
