import dayjs from "dayjs";

import * as S from "~/pages/settings/membership/rows/BillingPeriod/styles";

export const BillingPeriod = ({createdAt}: {createdAt: string}) => {
  const formattedCreatedAt = dayjs(createdAt).format("MMM D, YYYY");

  return (
    <S.BoldText>{formattedCreatedAt}</S.BoldText>
  );
};
