import { Trans, useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import * as S from "./styles";
import { useGetBulkCheckoutSummary } from "~/api/dropshipping/queries";
import Button from "~/components/ui/Button";
import { useEffect, useState } from "react";
import Table from "../../pages/orders/components/table";
import { columns } from "../../pages/orders/table";
import { formatPrice } from "~/helpers/formatPrice";
import { HorizontalSeparator } from "~/components/ui/Separator/styles";
import { checkoutOrder } from "~/api/dropshipping/requests";
import { toast } from "~/components/toast";
import { useQueryClient } from "@tanstack/react-query";
import { ORDERS } from "~/api/dropshipping/types";
import LoaderSVG from "~/assets/svg/loader.svg?react";
import { LineItem } from "~/types/dropshipping";
import { triggerGTMBulkCheckout } from "~/helpers/gtm";

type Props = {
  hide: () => void;
  orderType: string;
  selectAllUnpaid: boolean;
  ids: number[];
};

export const ShowBulkCheckoutSummary = ({
  hide,
  orderType,
  selectAllUnpaid,
  ids,
}: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetBulkCheckoutSummary(
    selectAllUnpaid ? [] : ids,
    orderType
  );
  const [confirm, setConfirm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !data) {
      hide();
      toast.error(t("orders.error_fetching_summary"));
    }
  }, [isLoading, data]);

  const checkoutSuborder = async (subOrderId: number) => {
    const lineItems = data.line_items.filter(
      (item: LineItem) => item.sub_order === subOrderId
    );
    const invalidItems = lineItems
      .filter((item: any) => item.quantity < item.moq_quantity)
      .map((item: any) => ({
        title: item.title,
        moq_quantity: item.moq_quantity,
      }));

    invalidItems.forEach((item: { moq_quantity: number; title: string }) => {
      toast.error(
        <Trans
          i18nKey={"orders.moq_error"}
          values={{ moq: item.moq_quantity  }}
        />
      );
    });

    if (invalidItems.length > 0) return;

    try {
      await checkoutOrder(subOrderId);
      queryClient.refetchQueries(ORDERS);
    } catch (error: any) {
      const message = error.response?.data?.message;

      if (message) {
        toast.error(message);
      } else {
        toast.error(t("orders.error_checkout"));
      }
    }
  };

  const onConfirm = async () => {
    const promises = data.sub_order_ids.map((subOrderId: number) =>
      checkoutSuborder(subOrderId)
    );
    await Promise.all(promises);
    triggerGTMBulkCheckout(data.sub_order_ids);
    hide();
  };

  return (
    <S.Container>
      <S.Title>{t("orders.bulk-checkout-summary")}</S.Title>
      {isLoading && (
        <S.Loader>
          <LoaderSVG />
        </S.Loader>
      )}
      {data && (
        <>
          <S.ScrollableTable>
            <Table
              hideActions
              tracking={{}}
              columns={columns}
              data={data?.line_items.map((item: any) => ({
                ...item,
              }))}
            />
          </S.ScrollableTable>
          <S.Summary>
            <S.Row>
              <S.Text>{t("orders.subtotal")}</S.Text>
              <S.Text>{formatPrice("USD", data.subtotal)}</S.Text>
            </S.Row>
            <S.Row>
              <S.Text>{t("orders.shipping-cost")}</S.Text>
              <S.Text>{formatPrice("USD", data.shipping_cost)}</S.Text>
            </S.Row>
            <S.Row>
              <S.Text>{t("orders.transaction-fee")}</S.Text>
              <S.Text>{formatPrice("USD", data.transaction_fee)}</S.Text>
            </S.Row>
            <HorizontalSeparator />
            <S.Row>
              <S.Label>{t("orders.grand-total")}</S.Label>
              <S.TextPrimary>{formatPrice("USD", data.total)}</S.TextPrimary>
            </S.Row>
            <HorizontalSeparator />
          </S.Summary>
        </>
      )}

      {!isLoading && (
        <>
          <S.CheckboxWrapper>
            <input
              type="checkbox"
              checked={confirm}
              onChange={() => setConfirm(!confirm)}
            />
            <S.Text>{t("orders.confirm-bulk-checkout")}</S.Text>
          </S.CheckboxWrapper>

          <FlexContainer width="100%" justifyContent="flex-end">
            <S.BackButton color="text" padding="9px 29px" onClick={hide}>
              {t("orders.cancel")}
            </S.BackButton>

            <Button
              color="white"
              bgColor="primary"
              padding="9px 29px"
              width="100%"
              onClick={onConfirm}
              isDisabled={!confirm}>
              {t("orders.confirm")}
            </Button>
          </FlexContainer>
        </>
      )}
    </S.Container>
  );
};
