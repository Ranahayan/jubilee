import { faLock } from "@fortawesome/pro-solid-svg-icons";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { usePlanFeature } from "~/hooks/usePlanFeature";
import Modal from "~/components/ui/Modal";
import { SVG } from "~/components/ui/SVG";
import {
  SHOW_LIMITS_MODAL,
  triggerShowPlansModal,
  triggerShowResumeModal,
} from "~/helpers/customEvents";
import { Limits } from "~/types/billing";
import * as S from "./styles";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import { useTranslation } from "react-i18next";
import { getFeaturesTranslations } from "~/constants/features";
import FeaturesTestimonialImg from "~/assets/png/features-testimonial.png";
import { useMinimumPlanForLimit } from "~/hooks/useMinimumPlanForLimit";
import { usePlans } from "~/api/billing/queries";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

interface Props {
  limitType: Limits;
  hide: () => void;
}

const LimitsModalInternal = ({ limitType, hide }: Props) => {
  const { t } = useTranslation();
  const { minimumPlan, hasAbovePlans } = useMinimumPlanForLimit(limitType);
  const navigate = useNavigate();

  if (!minimumPlan) return null;

  const translations = getFeaturesTranslations(
    t,
    limitType,
    minimumPlan.name,
    hasAbovePlans
  );

  return (
    <Modal
      id="plan-limits"
      isShowing={true}
      hide={hide}
      padding="24px"
      minWidth="min(90%, 480px)">
      <S.IconContainer>
        <SVG icon={faLock} color="primary" size="xl" />
      </S.IconContainer>

      <S.Title>{translations.title}</S.Title>

      <S.Description>{translations.description}</S.Description>

      <S.TestimonialContainer>
        <S.TestimonialImage src={FeaturesTestimonialImg} />

        <S.TestimonialText>{translations.testimonial}</S.TestimonialText>
      </S.TestimonialContainer>

      <S.SwitchButton
        onClick={() => {
          hide();
          if (!minimumPlan.id) {
            triggerShowPlansModal();
          } else {
            navigate({
              pathname: paths.checkout.index,
            }, { state: { selectedPlanId: minimumPlan?.id || "" } })
          }
        }}>
        {t("features.switch_to_plan", { planName: minimumPlan.name })}
      </S.SwitchButton>

      <S.DisclaimerText>
        {t("features.plan_disclaimer", { planName: minimumPlan.name })}
      </S.DisclaimerText>
    </Modal>
  );
};

export const LimitsModal = () => {
  const [shownLimit, setShownLimit] = useState<Limits | undefined>(undefined);
  const { isFeaturePaused } = usePlanFeature();
  const { data: plans } = usePlans();

  useEffect(() => {
    const handleEvent = ((e: CustomEvent<{ limitType: Limits }>) => {
      if (isFeaturePaused()) {
        triggerShowResumeModal();
      } else {
        setShownLimit(e.detail.limitType);
      }
    }) as EventListener;

    window.addEventListener(SHOW_LIMITS_MODAL, handleEvent);

    return () => {
      window.removeEventListener(SHOW_LIMITS_MODAL, handleEvent);
    };
  }, [isFeaturePaused]);

  if (!shownLimit || !plans || DISABLE_PAYMENTS) return null;

  return ReactDOM.createPortal(
    <LimitsModalInternal
      limitType={shownLimit}
      hide={() => setShownLimit(undefined)}
    />,
    document.body
  );
};
