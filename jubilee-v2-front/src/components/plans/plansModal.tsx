import * as S from "./plansModal.style";
import { SVG } from "~/components/ui/SVG";
import { faClose } from "@fortawesome/pro-light-svg-icons";
import { useEffect, useState } from "react";
import { Plans } from "~/components/plans";
import {
  SHOW_PLANS_MODAL,
  triggerShowResumeModal,
} from "~/helpers/customEvents";
import ReactDOM from "react-dom";
import { usePlanFeature } from "~/hooks/usePlanFeature";
import { useUserPilotSearchParams } from "~/hooks/useUserPilotSearchParams";

export const PlansModal = () => {
  const [showPlansModal, setShowPlansModal] = useState<
    | { show: false; initialIsAnnual?: undefined }
    | { show: true; initialIsAnnual: boolean }
  >({
    show: false,
  });
  const { isFeaturePaused } = usePlanFeature();
  useUserPilotSearchParams("plans-modal", showPlansModal.show);

  // Show plans modal when user needs to upgrade
  useEffect(() => {
    const handleRequiresUpgrade = (
      e: CustomEvent<{ initialIsAnnual: boolean }>
    ) => {
      if (isFeaturePaused()) {
        triggerShowResumeModal();
      } else {
        setShowPlansModal({
          show: true,
          initialIsAnnual: e?.detail?.initialIsAnnual,
        });
      }
    };
    // @ts-ignore
    window.addEventListener(SHOW_PLANS_MODAL, handleRequiresUpgrade);
    return () => {
      // @ts-ignore
      window.removeEventListener(SHOW_PLANS_MODAL, handleRequiresUpgrade);
    };
  }, [isFeaturePaused]);

  if (!showPlansModal.show) return null;

  return ReactDOM.createPortal(
    <S.ModalWrapper>
      <S.ModalContent>
        <S.CloseContainer onClick={() => setShowPlansModal({ show: false })}>
          <SVG icon={faClose} size="xl" />
        </S.CloseContainer>
        <Plans
          closeModal={() => setShowPlansModal({ show: false })}
          initialIsAnnual={showPlansModal.initialIsAnnual}
        />
      </S.ModalContent>
    </S.ModalWrapper>,
    document.body
  );
};
