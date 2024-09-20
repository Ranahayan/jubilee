import * as S from "./styles";
import { SVG } from "../SVG";
import { faSparkles, faStars } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "../SVG/types";
import { useTranslation } from "react-i18next";

type Props = {
  handleAction: () => void;
};

export const AskAiButton = ({ handleAction }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <S.ButtonStyled onClick={handleAction}>
        <SVG icon={faSparkles as SVGIcon} size="sm" invertY />
        <S.AIText className="ai-text">{t("blog.ask_ai")}</S.AIText>
      </S.ButtonStyled>
    </>
  );
};
