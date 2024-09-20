import { useTranslation } from "react-i18next";
import { SVGIcon } from "../SVG/types";
import { faCopy } from "@fortawesome/pro-solid-svg-icons";
import { toast } from "~/components/toast";
import { SVG } from "../SVG";
import Input from "../Input";

import * as S from "./styles";

type Props = {
  value: string;
};

export const CopyInput = ({ value }: Props) => {
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("common.copied"));
    } catch (err) {
      toast.error(t("common.failed_copied"));
    }
  };

  return (
    <S.InputCopyWrapper>
      <Input type="string" isDisabled={true} value={value} />
      <S.CopyButton onClick={handleCopy}>
        <SVG icon={faCopy as SVGIcon} color="white" />
      </S.CopyButton>
    </S.InputCopyWrapper>
  );
};
