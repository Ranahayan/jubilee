import * as S from "./styles";
import ProgressBar from "../ProgressBar";
import { SVG } from "../SVG";
import { faCheckCircle } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "../SVG/types";
import { useTranslation } from "react-i18next";

type Step = {
  title: string;
};

type Props = {
  steps: Step[];
  currentStep: number;
  image?: boolean;
  color?: string;
};

const Steps = ({ steps, currentStep, image, color }: Props) => {
  const { t } = useTranslation();
  const totalSteps = steps.length;
  return (
    <S.StepsContainer>
      <ProgressBar
        bgColor="borderSecondary"
        color={color || "success"}
        progress={(currentStep / totalSteps) * 100}
      />
      {steps.map((step, i) => (
        <S.Step style={{ left: `${(i / (totalSteps - 1)) * 100}%` }}>
          {image ? <S.CheckIMG
            src={i < currentStep ? "/svg/check.svg" : "/svg/check_disabled.svg"}
          /> : <SVG icon={faCheckCircle as SVGIcon} size="xl" color={color} />}
          <S.StepText color={i < currentStep ? color || "success" : "text"}>
            {t(step.title)}
          </S.StepText>
        </S.Step>
      ))}
    </S.StepsContainer>
  );
};

export default Steps;
