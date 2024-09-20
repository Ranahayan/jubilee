import { SVGIcon } from "~/components/ui/SVG/types";
import Modal from "~/components/ui/Modal";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import Button from "~/components/ui/Button";
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
    <Modal id={id} isShowing={isShowing} padding="24px" minWidth="20%">
      <FlexContainer
        flexDirection="column"
        gap={1.6}
        alignItems="flex-start"
        justifyContent="flex-start">
        {icon ? (
          <S.IconContainer>
            <SVG icon={icon} size="xl" color="primary" />
          </S.IconContainer>
        ) : null}

        <FlexContainer
          flexDirection="column"
          width="352px"
          padding={0}
          alignItems="flex-start"
          justifyContent="flex-start">
          <S.ModalTitle>{title}</S.ModalTitle>
          <S.ModalDescription>{description}</S.ModalDescription>
        </FlexContainer>
        <FlexContainer width="100%">
          <Button
            color="secondary"
            bgColor="white"
            outline
            children={buttonCancelText}
            onClick={hide}
            width="50%"
            size="lg"
            alignSelf="center"
          />
          <Button
            color="white"
            bgColor={buttonColor}
            children={buttonText}
            onClick={handleActionAndClose}
            size="lg"
            width="50%"
            alignSelf="center"
          />
        </FlexContainer>
      </FlexContainer>
    </Modal>
  );
};
