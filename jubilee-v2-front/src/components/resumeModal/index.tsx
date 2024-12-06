import { resumeSubscription } from "~/api/billing/requests";
import { useTranslation } from "react-i18next";
import handleErrors from "~/helpers/handleErrors";
import FlexContainer from "~/components/ui/FlexContainer";
import Modal from "~/components/ui/Modal";
import { useEffect, useState } from "react";
import { SHOW_RESUME_MODAL } from "~/helpers/customEvents";
import { useAccount } from "~/hooks/useAccount";
import * as S from "./styles";
import { faRotateRight } from "@fortawesome/pro-light-svg-icons";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { isFeatureCrossedOff } from "../plans/planCard";

export const ResumeModal = () => {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();
  const { account, getAccount } = useAccount();

  useEffect(() => {
    const handleResumeModal = () => setShow(true);
    // @ts-ignore
    window.addEventListener(SHOW_RESUME_MODAL, handleResumeModal);
    return () => {
      // @ts-ignore
      window.removeEventListener(SHOW_RESUME_MODAL, handleResumeModal);
    };
  }, []);

  const handleResume = async () => {
    const toastMessages = {
      loading: t("settings.loading_unpause"),
      success: t("settings.unpause_success"),
      error: t("settings.unpause_error"),
    };

    const { errors } = await handleErrors(
      () => resumeSubscription(),
      toastMessages
    );

    if (!errors) {
      setTimeout(() => {
        getAccount();
        setShow(false);
      }, 200);
    }
  };

  return (
    <Modal
      id="resume-subscription"
      isShowing={show}
      hide={() => setShow(false)}
      minWidth="min(80%, 400px)"
      padding="24px">
      <FlexContainer flexDirection="column" gap={3.2}>
        <S.Header>
          <S.IconContainer>
            <S.Logo src="/logo.svg" />
            <S.LogoArrow icon={faRotateRight} color="disabled" />
          </S.IconContainer>
          <S.Title>{t("settings.confirm_plan_resumption")}</S.Title>
          <S.Description>{t("settings.resume_your_plan")}</S.Description>
        </S.Header>

        <S.FeaturesContainer>
          {account?.active_subscription?.plan.features
            .filter((feature) => !isFeatureCrossedOff(feature))
            .map((feature) => (
              <FlexContainer key={feature} justifyContent="flex-start">
                <SVG icon={faCheck} color="green" size="sm" />
                <S.FeatureText dangerouslySetInnerHTML={{ __html: feature }} />
              </FlexContainer>
            ))}
        </S.FeaturesContainer>

        <FlexContainer gap={1.2} width="100%" flexWrap="wrap">
          <S.CancelButton onClick={() => setShow(false)}>
            {t("settings.cancel_plan_resumption")}
          </S.CancelButton>

          <S.ConfirmButton onClick={handleResume}>
            {t("settings.resume_plan_confirmation")}
          </S.ConfirmButton>
        </FlexContainer>
      </FlexContainer>
    </Modal>
  );
};
