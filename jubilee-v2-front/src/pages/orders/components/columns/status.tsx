import { useTranslation } from "react-i18next";
import * as S from "../../styles";

interface IStatusTagProps {
  value: string;
}


export const StatusTag = ({ value }: IStatusTagProps) => {
  const { t } = useTranslation();
  
  return (
    <S.StatusWrapper>
      <S.StatusTag><S.Circle color={value} /> {t("orders." + value)}</S.StatusTag>
    </S.StatusWrapper>
  );
}