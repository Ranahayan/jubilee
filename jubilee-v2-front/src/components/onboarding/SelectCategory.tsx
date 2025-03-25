import {
  useDropshippingSettings,
  useGetCategories,
} from "~/api/dropshipping/queries";
import * as S from "./styles";
import {
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { useUpload } from "~/hooks/useUpload";
import { IOnboardingChoices } from "~/types/account";
import FlexContainer from "../ui/FlexContainer";
import { FormContext, useForm } from "~/hooks/useForm";
import { Form } from "../ui/Form";
import RadioButton from "../ui/Radio";
import CustomCheckbox from "../ui/Checkbox";

type Props = {
  onboardingChoices: IOnboardingChoices | undefined;
  setOnboardingChoices: Dispatch<
    SetStateAction<IOnboardingChoices | undefined>
  >;
};

export const SelectCategory = ({
  onboardingChoices,
  setOnboardingChoices,
}: Props) => {
  const { t } = useTranslation();
  const { data: categories } = useGetCategories();
  const specificCategoryNames = [
    t("dropshipping.hair_care"),
    t("dropshipping.eye_makeup"),
    t("dropshipping.cosmetics"),
  ];
  const filteredCategories =
    categories?.filter((category) =>
      specificCategoryNames.includes(category.name)
    ) || [];

  const newCategories = categories
    ? [
        ...filteredCategories,
        { id: null, name: t("onboarding.tranding") },
      ]
    : [];
  
  useEffect(() => {
    if (
      onboardingChoices?.selectedCategories?.length === 0 ||
      onboardingChoices?.selectedCategories === undefined
    ) {
      const lastCategory = newCategories[newCategories.length - 1];
      if (lastCategory) {
        setOnboardingChoices((prev) => ({
          ...prev,
          selectedCategories: [lastCategory.id],
        }));
      }
    }
  }, []);

  // Function to check if all categories are selected
  const areAllCategoriesSelected = () => {
    return (
      onboardingChoices?.selectedCategories?.length === categories?.length &&
      onboardingChoices?.selectedCategories?.every((catId) =>
        categories?.some((category) => category.id === catId)
      )
    );
  };

  // Function to handle 'all' selection
  const handleAllSelection = () => {
    if (areAllCategoriesSelected()) {
      setOnboardingChoices((prev) => ({
        ...prev,
        selectedCategories: [],
      }));
    } else {
      setOnboardingChoices((prev) => ({
        ...prev,
        selectedCategories: categories?.map((category) => category.id),
      }));
    }
  };

  const handlePrevSelection = (
    prev: IOnboardingChoices | undefined,
    id: string | number
  ) => {
    if (prev?.selectedCategories?.includes(id)) {
      return prev?.selectedCategories?.filter((catId) => catId !== id);
    } else {
      // If 'null' is already selected, remove it before adding the new category
      const newCategories = prev?.selectedCategories?.includes(null)
        ? []
        : [...(prev?.selectedCategories || [])];
      return [...newCategories, id];
    }
  };

  // Function to handle individual category selection
  const handleCategorySelection = (id: string | number) => {
    setOnboardingChoices((prev) => ({
      ...prev,
      selectedCategories: handlePrevSelection(prev, id),
    }));
  };

  const handleCategorySelect = (id: string | number | null) => {
    if (id === null) {
      setOnboardingChoices((prev) => ({ ...prev, selectedCategories: [null] }));
    } else if (id === "all") {
      handleAllSelection();
    } else {
      handleCategorySelection(id);
    }
  };

  return (
    <S.CardContainer>
      {newCategories?.map((category) => (
        <S.CardCategory
          key={category.id}
          className={
            onboardingChoices?.selectedCategories?.includes(category.id)
              ? "active"
              : ""
          }
          onClick={() => handleCategorySelect(category.id)}>
          <>
            {category.id === null ? (
              <RadioButton
                checked={onboardingChoices?.selectedCategories?.includes(
                  category.id
                )}
                onChange={() => handleCategorySelect(category.id)}
              />
            ) : (
              <CustomCheckbox
                onChange={() => handleCategorySelect(category.id)}
                checked={onboardingChoices?.selectedCategories?.includes(
                  category.id
                )}
              />
            )}
            {category.name}
          </>
        </S.CardCategory>
      ))}
    </S.CardContainer>
  );
};

type PropsBrand = {
  form?: ReturnType<typeof useForm>;
};

export const PersonalizeBrand = ({ form }: PropsBrand) => {
  const { data } = useDropshippingSettings();
  const { upload } = useUpload();

  if (!form) {
    return null;
  }

  useEffect(() => {
    if (data) {
      const { brand_name, brand_logo } = data;

      form.loadValues({
        brand_name,
        brand_logo,
      });
    }
  }, [data]);

  return (
    <FlexContainer gap="16px" width="100%" flexDirection="column">
      <FormContext.Provider value={{ uploadFile: upload }}>
        <Form {...form} />
      </FormContext.Provider>
    </FlexContainer>
  );
};
