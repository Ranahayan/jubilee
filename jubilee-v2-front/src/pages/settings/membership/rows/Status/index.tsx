import * as S from "~/pages/settings/membership/rows/Status/styles";
import { InvoiceStatus } from "~/types/billing";
import { startCase } from "lodash";

type Props = {
  status: InvoiceStatus;
};

export const Status = ({ status }: Props) => {
  const camelCaseStatus = startCase(status);

  return (
    <S.StatusStyle className={status || ""}>{camelCaseStatus}</S.StatusStyle>
  );
};
