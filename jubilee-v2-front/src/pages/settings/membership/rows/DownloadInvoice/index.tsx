import { useTranslation } from "react-i18next";

import * as S from "~/pages/settings/membership/rows/DownloadInvoice/styles";

type Props = {
  invoice_pdf: string;
};

export const DownloadInvoice = ({ invoice_pdf }: Props) => {
  const { t } = useTranslation();

  return (
    <S.FlexContainerStyled>
      <S.StyledButton onClick={() => window.open(invoice_pdf, "_blank")}>
        {t("settings.download_invoice")}
      </S.StyledButton>
    </S.FlexContainerStyled>
  );
};
