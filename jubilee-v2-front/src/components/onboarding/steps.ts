import { Dispatch, SetStateAction } from "react";
import { IOnboardingChoices } from "~/types/account";
import { PersonalizeBrand, SelectCategory } from "./SelectCategory";
import { useForm } from "~/hooks/useForm";

interface Step {
  titleKey: string;
  component: (props: {
    onboardingChoices: IOnboardingChoices | undefined;
    setOnboardingChoices: Dispatch<
      SetStateAction<IOnboardingChoices | undefined>
    >;
    form?: ReturnType<typeof useForm>;
  }) => JSX.Element | null;
  onContinue?: (onboardingChoices: IOnboardingChoices) => void;
}

export const steps: Step[] = [
  {
    titleKey: "onboarding.category_title",
    component: SelectCategory
  },
  {
    titleKey: "onboarding.personalize",
    component: PersonalizeBrand,
  }
];
