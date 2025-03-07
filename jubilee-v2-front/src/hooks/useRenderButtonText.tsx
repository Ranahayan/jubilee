import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { DefaultTFuncReturn } from "i18next";
import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";

type Props = {
  isProcessed: boolean;
  loading?: boolean;
  actionText?: string | DefaultTFuncReturn;
  postActionText?: string | DefaultTFuncReturn;
};

export const useRenderButtonText = ({
  isProcessed,
  loading,
  actionText,
  postActionText,
}: Props) => {
  const { t } = useTranslation();

  return () => {
    if (isProcessed)
      return (
        <FlexContainer>
          {postActionText}
          <SVG icon={faCheck as SVGIcon} color="white" size="lg" />
        </FlexContainer>
      );
    if (loading) return t("common.loading");

    return actionText;
  };
};
