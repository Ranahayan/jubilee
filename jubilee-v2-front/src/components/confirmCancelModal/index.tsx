import { useTranslation } from "react-i18next";
import PauseIcon from "~/assets/svg/pause.svg?react";
import CancelImg from "~/assets/svg/cancel_img.svg";
import * as S from "~/components/confirmCancelModal/styles";
import Button from "~/components/ui/Button";
import Modal from "~/components/ui/Modal";
import { useMediaQuery } from "~/hooks/useMediaQuery";

type Props = {
  isShowing: boolean;
  hide: () => void;
  handlePause: () => void;
  handleCancel: () => void;
  id?: string;
};

export const ConfirmCancelModal = ({
  isShowing,
  hide,
  handlePause,
  handleCancel,
  id,
}: Props) => {
  const { t } = useTranslation();
  const isLaptop = useMediaQuery("desktop");

  return (
    <Modal
      id={id}
      isShowing={isShowing}
      hide={() => hide()}
      minWidth={isLaptop ? "50%" : "80%"}>
      <S.ConfirmCancelContainer>
        <PauseIcon />
        <S.Title>{t("settings.cancel_membership_modal_title")}</S.Title>
        <S.CancelImg src={CancelImg} />
        <S.SubTitle>{t("settings.pause_billing")}</S.SubTitle>
        <Button
          color="white"
          bgColor="primary"
          padding="12px 68px"
          alignSelf="center"
          onClick={() => {
            handlePause();
            hide();
          }}>
          {t("settings.pause_my_plan")}
        </Button>
        <S.CancelText
          onClick={() => {
            handleCancel();
            hide();
          }}>
          {t("settings.cancel_my_plan")}
        </S.CancelText>
      </S.ConfirmCancelContainer>
    </Modal>
  );
};
