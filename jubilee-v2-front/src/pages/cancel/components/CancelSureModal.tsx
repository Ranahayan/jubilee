import FlexContainer from "~/components/ui/FlexContainer";
import Modal from "~/components/ui/Modal";

import * as S from "./styles";
import { Trans, useTranslation } from "react-i18next";
import Input from "~/components/ui/Input";
import { useState } from "react";
import Button from "~/components/ui/Button";
import { faLeftToLine } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "~/components/ui/SVG";
import {
  faCircleExclamation,
  faXmarkCircle,
} from "@fortawesome/pro-regular-svg-icons";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import { useCancelSubscription } from "~/api/billing/queries";
import { useForm } from "~/hooks/useForm";
import { formConfig } from "~/components/confirm-password/form";
import handleErrors from "~/helpers/handleErrors";
import { useAccount } from "~/hooks/useAccount";
import { toast } from "~/components/toast";
import { ConfirmPassword } from "~/components/confirm-password";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

type CancelSureModalProps = {
  isShowing: boolean;
  hide: () => void;
  saveInfo: () => void;
};

export const CancelSureModal = ({
  isShowing,
  hide,
  saveInfo,
}: CancelSureModalProps) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const { mutateAsync: cancelSubscription } = useCancelSubscription();
  const form = useForm(formConfig);
  const { account, refetch } = useAccount();
  const hasPassword = account?.has_password;
  const [showModal, setShowModal] = useState(false);
  const isAboveTablet = useMediaQuery("tablet");

  const handleCancel = async () => {
    const values = form.getValues();
    if (!hasPassword) toast.error(t("settings.password_required"));

    const toastMessages = {
      loading: t("settings.canceling"),
      success: t("settings.canceled"),
      error: t("auth.error"),
    };

    const { response } = await handleErrors(
      () =>
        cancelSubscription({
          password: values.password as string,
          confirm_password: values.confirm_password as string,
        }),
      toastMessages
    );

    if (response) {
      setTimeout(() => {
        saveInfo();
        refetch();
        navigate(
          DISABLE_PAYMENTS ? paths.settings.account : paths.settings.plans
        );
        hide();
      }, 500);
    }
  };

  return (
    <Modal
      id="cancel-subscription"
      isShowing={isShowing}
      hide={hide}
      padding="36px">
      <FlexContainer
        width={isAboveTablet ? "486px" : "100%"}
        gap="38px"
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="flex-start">
        <FlexContainer
          width="100%"
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="flex-start">
          <S.IconContainer>
            <SVG icon={faCircleExclamation} color="red" size="xl" />
          </S.IconContainer>
          <S.SureTitle>{t("cancel.sure")}</S.SureTitle>
          <S.StyledText>
            <Trans
              i18nKey="cancel.sure_desc"
              components={{ 1: <span translate="no" /> }}
            />
          </S.StyledText>
          <Input
            type="string"
            placeholder={t("cancel.typing") as string}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </FlexContainer>

        <FlexContainer
          width="100%"
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="flex-start">
          <Button
            bgColor="green"
            color="white"
            padding="10px"
            width="100%"
            radius="8px"
            onClick={() => navigate(paths.app.home)}
            style={{ fontSize: "16px", fontWeight: "500" }}>
            <SVG icon={faLeftToLine} color="white" size="xl" />
            {t("cancel.nevermind")}
          </Button>
          <Button
            bgColor="transparent"
            color="red"
            padding="10px"
            width="100%"
            radius="8px"
            onClick={() => setShowModal(true)}
            isDisabled={!(text === "CONFIRM")}
            style={{ fontSize: "16px", fontWeight: "500" }}>
            <SVG icon={faXmarkCircle} color="red" size="xl" />
            {t("cancel.cancel_account")}
          </Button>
        </FlexContainer>
      </FlexContainer>

      <Modal
        id="confirm-password"
        isShowing={showModal}
        hide={() => setShowModal(false)}
        padding="36px">
        <ConfirmPassword
          form={form}
          title={t("settings.cancel")}
          hide={() => setShowModal(false)}
          handleAction={handleCancel}
          buttonText={t("settings.cancel")}
        />
      </Modal>
    </Modal>
  );
};
