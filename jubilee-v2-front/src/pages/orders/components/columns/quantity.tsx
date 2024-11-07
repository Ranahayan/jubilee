import { useCallback, useState } from "react";
import Text from "~/components/ui/Text";
import * as S from "../../styles";
import handleErrors from "~/helpers/handleErrors";
import { createSampleOrder } from "~/api/dropshipping/requests";
import _debounce from "lodash/debounce";
import { useQueryClient } from "@tanstack/react-query";
import { ORDERS } from "~/api/dropshipping/types";
import { Status } from "~/types/dropshipping";
import { Trans, useTranslation } from "react-i18next";
import Input from "~/components/ui/Input";
import { toast } from "~/components/toast";

type Props = {
  maxQuantity: number;
  isSampleOrder: boolean;
  status: string;
  realQuantity: number;
  variant?: number;
};

export const Quantity = ({
  maxQuantity,
  isSampleOrder,
  status,
  variant,
  realQuantity,
}: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState<string>(realQuantity.toString());
  const isPaid = status !== Status.UNPAID;
  const maximumQuantityText = (
    <Trans i18nKey="orders.maximum_quantity" values={{ value: maxQuantity }} />
  );

  const handleSelectQuantity = (quantity: string) => {
    setQuantity(quantity);
    if (parseInt(quantity) > maxQuantity)
      return toast.error(maximumQuantityText);

    const payload = {
      quantity: parseInt(quantity),
      variant_id: variant as number,
    };

    const toastMessages = {
      loading: t("orders.loading_update_quantity"),
      success: t("orders.success_update_quantity"),
      error: t("orders.error_update_quantity"),
    };

    handleErrors(() => createSampleOrder(payload), toastMessages);

    setTimeout(() => {
      queryClient.refetchQueries(ORDERS);
      queryClient.invalidateQueries(ORDERS);
    }, 200);
  };

  const debouncedHandleSelectQuantity = useCallback(
    _debounce(handleSelectQuantity, 200),
    []
  );

  return (
    <S.CenterText>
      {isSampleOrder && !isPaid ? (
        <div>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => debouncedHandleSelectQuantity(e.target.value)}
            max={maxQuantity}
            min={1}
            wrapperStyle={{ width: "70px" }}
          />
        </div>
      ) : (
        <Text>{realQuantity}</Text>
      )}
    </S.CenterText>
  );
};
