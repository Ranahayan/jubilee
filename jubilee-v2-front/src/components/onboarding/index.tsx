import { useMediaQuery } from "~/hooks/useMediaQuery";
import Modal from "../ui/Modal";
import { useCallback, useEffect, useState } from "react";
import FlexContainer from "../ui/FlexContainer";
import ProgressBar from "../ui/ProgressBar";
import { useTranslation } from "react-i18next";
import { steps } from "./steps";
import * as S from "./styles";
import Button from "../ui/Button";
import { useAccount } from "~/hooks/useAccount";
import { IOnboardingChoices } from "~/types/account";
import { editProfile } from "~/api/account/requests";
import handleErrors from "~/helpers/handleErrors";
import { useForm } from "~/hooks/useForm";
import { brandingFormConfig } from "./form";
import { DROPSHIPPING_SETTINGS, IDropshippingSettings } from "~/api/dropshipping/types";
import { IFile } from "~/types/upload";
import { useUpdateDropshippingSettings } from "~/api/dropshipping/queries";
import { useQueryClient } from "@tanstack/react-query";
import { SVG } from "../ui/SVG";
import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  isShowing: boolean;
  onFinish: () => void;
}

export const FixedElement = ({
  handleContinue,
}: {
  handleContinue: () => void;
}) => {
  const { t } = useTranslation();
  const isAboveDesktop = useMediaQuery("laptop");

  if (isAboveDesktop) return null;

  return (
    <S.ButtonFixedContainer>
      <Button
        bgColor="primary"
        color="white"
        width="100%"
        onClick={handleContinue}>
        {t("onboarding.continue")}
      </Button>
    </S.ButtonFixedContainer>
  );
};

export const Onboarding = ({ isShowing, onFinish }: Props) => {
  const { t } = useTranslation();
  const form = useForm(brandingFormConfig);
  const isAboveDesktop = useMediaQuery("laptop");
  const savedStepIndex = localStorage.getItem("onboardingStepIndex");
  const [stepIndex, setStepIndex] = useState(
    savedStepIndex ? parseInt(savedStepIndex, 10) : 0
  );
  const { account, refetch } = useAccount();
  const [onboardingChoices, setOnboardingChoices] = useState<IOnboardingChoices | undefined>(undefined);
  const { mutateAsync: updateSettings } = useUpdateDropshippingSettings();
  const client = useQueryClient();

  useEffect(() => {
    if (account) {
      setOnboardingChoices(account.onboarding_choices);
    }
  }, [account]);

  const handleBrandingSave = useCallback(async () => {
    const payload: IDropshippingSettings = {
      ...form.getValues(),
    };
    payload.brand_logo = ((payload.brand_logo as IFile) || {}).id as number;

    const { errors } = await handleErrors(
      () => updateSettings(payload),
      //@ts-ignore
      {}
    );
    if (!errors) {
      client.invalidateQueries(DROPSHIPPING_SETTINGS);
    }
  }, [form, updateSettings, client]);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex === 0;

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleContinue = async () => {
    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      return;
    }

    await handleBrandingSave();

    const { errors } = await handleErrors(
      () => editProfile({ onboarding_choices: onboardingChoices }),
      {}
    );

    if (!errors) {
      refetch();
      localStorage.setItem("onboardingStepIndex", stepIndex.toString());
      onFinish();
    }
  };

  if (steps.length === 0 || !account) {
    return null;
  }

  return (
    <Modal
      isShowing={isShowing}
      fixedElement={<FixedElement handleContinue={handleContinue} />}
      minWidth={isAboveDesktop ? "43%" : "95%"}
      padding={isAboveDesktop ? "40px" : "20px"}>
      <FlexContainer flexDirection="column" gap="20px">
        <FlexContainer
          flexDirection="column"
          gap="0"
          width="100%"
          alignItems="flex-start">
          <FlexContainer gap={0.8}>
            {isFirstStep ? null : (
              <Button
                padding="0"
                alignSelf="center"
                onClick={handleBack}
                bgColor="transparent">
                <SVG icon={faChevronLeft} color="textSecondary" />
              </Button>
            )}
            <S.StepTitle>{t(step.titleKey)}</S.StepTitle>
          </FlexContainer>
          {isAboveDesktop ? (
            <ProgressBar
              progress={((stepIndex + 1) / steps.length) * 100}
              color="primary"
            />
          ) : null}
        </FlexContainer>

        <step.component
          onboardingChoices={onboardingChoices}
          setOnboardingChoices={setOnboardingChoices}
          form={form}
        />

        <FlexContainer
          justifyContent="space-between"
          flexDirection={isAboveDesktop ? "row" : "column"}
          width="100%">
          {isAboveDesktop ? (
            <Button
              bgColor="transparent"
              color="textSecondary"
              padding="16px 24px"
              onClick={handleContinue}>
              {t("onboarding.skip")}
            </Button>
          ) : (
            <Button
              bgColor="borderSecondary"
              color="textSecondary"
              width="100%"
              onClick={handleContinue}>
              {t("onboarding.skip")}
            </Button>
          )}

          <FlexContainer>
            {isAboveDesktop ? (
              <Button
                bgColor="primary"
                color="white"
                padding="16px 24px"
                onClick={handleContinue}>
                {t("onboarding.continue")}
              </Button>
            ) : null}
          </FlexContainer>
        </FlexContainer>
      </FlexContainer>
    </Modal>
  );
};