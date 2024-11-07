import * as S from "../../styles";
import { CheckoutButton } from "../checkoutButton";
import { Tracking } from "../tracking";
import { CancelOrderButton } from "../cancelOrderButton";
import { SubOrder, TrackingData } from "~/types/dropshipping";
import { toast } from "~/components/toast";
import { useTranslation } from "react-i18next";


interface ActionsProps {
  orderId: number;
  subOrderId: number;
  isSampleOrder: boolean;
  status: string;
  tracking?: TrackingData;
  invalidItems: Array<{ moq_quantity: number; title: string }>;
  subOrder: SubOrder;
}

export const Actions = ({
  orderId,
  subOrderId,
  isSampleOrder,
  tracking,
  status,
  invalidItems,
  subOrder,
} : ActionsProps) => {
  const { t } = useTranslation();

  const isMoqValid = () => {
    const total = subOrder?.line_items.reduce((acc, cur) => {
      return acc + cur.quantity;
    }, 0);

    const moq = subOrder?.line_items[0].moq_quantity;
    const isValid = total >= moq;
    if (!isValid) toast.error(t("orders.moq_error", { moq }));
    return isValid;
  };
  
  return (
    <S.Actions>
      {(tracking?.trackingNumber || tracking?.trackingUrl) && (
        <Tracking
          trackingNumber={tracking?.trackingNumber as string}
          trackingUrl={tracking?.trackingUrl as string}
          carrier={tracking?.carrier as string}
        />
      )}

      <CheckoutButton
        order_id={orderId}
        sub_order_id={subOrderId}
        status={status}
        isSampleOrder={isSampleOrder}
        invalidItems={invalidItems}
        isMoqValid={isMoqValid}
      />

      {status == "unpaid" && <CancelOrderButton subOrderId={subOrderId} />}
    </S.Actions>
  );
};
