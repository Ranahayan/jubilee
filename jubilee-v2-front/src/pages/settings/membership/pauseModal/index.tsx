import Modal from "~/components/ui/Modal";
import PausePlanImg from "~/assets/svg/pause-plan.svg";
import PausePlanImgSimple from "~/assets/svg/pause-plan-simple.svg";
import * as S from "./styles";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useTranslation } from "react-i18next";
import handleErrors from "~/helpers/handleErrors";
import { pauseSubscription } from "~/api/billing/requests";
import { useAccount } from "~/hooks/useAccount";
import { triggerGTMPausePlan } from "~/helpers/gtm";

interface Props {
  isShowing: boolean;
  hide: () => void;
  redirect?: () => void;
}

export const PauseModal = ({ isShowing, hide, redirect }: Props) => {
  const { t } = useTranslation();
  const isAboveMobileL = useMediaQuery("mobileL");
  const { account, getAccount } = useAccount();

  const handlePause = async () => {
    const toastMessages = {
      loading: t("settings.loading_pause"),
      success: t("settings.pause_success"),
      error: t("settings.pause_error"),
    };

    const { errors } = await handleErrors(
      () => pauseSubscription(),
      toastMessages
    );

    if (!errors) {
      if (account?.active_subscription) {
        triggerGTMPausePlan(account.active_subscription.plan);
      }

      setTimeout(() => {
        getAccount();
        redirect && redirect();
        hide();
      }, 500);
    }
  };

  return (
    <Modal id="pause-modal" padding="0" isShowing={isShowing} minWidth="min(80%, 482px)">
      <S.Header>
        <img src={isAboveMobileL ? PausePlanImg : PausePlanImgSimple} />
      </S.Header>

      <S.Body>
        <S.Title>{t("settings.pause_plan")}</S.Title>
        <S.Description>{t("settings.pause_modal_desc")}</S.Description>

        <S.Footer>
          <S.CancelButton onClick={() => hide()}>
            {t("settings.cancel_pause_plan")}
          </S.CancelButton>
          <S.ConfirmButton onClick={handlePause}>
            {t("settings.pause_plan_confirmation")}
          </S.ConfirmButton>
        </S.Footer>
      </S.Body>
    </Modal>
  );
};
