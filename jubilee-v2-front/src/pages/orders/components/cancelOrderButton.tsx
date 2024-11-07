import { faCircleXmark } from "@fortawesome/pro-regular-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import * as S from "../styles";
import Modal from "~/components/ui/Modal";
import { ConfirmCancelOrder } from "~/components/confirm-cancel-order/confirmCancelOrder";
import { useState } from "react";
import { useCancelSubOrder } from "~/api/dropshipping/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ORDERS } from "~/api/dropshipping/types";

interface CancelOrderButtonProps {
  subOrderId: number;
}

export const CancelOrderButton = ({ subOrderId }: CancelOrderButtonProps) => {
  const [show, setShow] = useState(false);
  const { mutateAsync: cancelSubOrder } = useCancelSubOrder();
  const queryClient = useQueryClient();

  const handleCancelOrder = async () => {
    setShow(false);
    await cancelSubOrder(subOrderId);
    queryClient.refetchQueries(ORDERS);
  };

  return (
    <>
      <S.IconButton onClick={() => setShow(true)}>
        <SVG icon={faCircleXmark as SVGIcon} size="xl"/>
      </S.IconButton>
      <Modal
        id="cancel-order"
        hideCloseButton hide={() => setShow(false)}
        isShowing={show}
        padding="24px 28px"
      >
        <ConfirmCancelOrder
          hide={() => setShow(false)}
          onConfirm={handleCancelOrder}
        />
      </Modal>
    </>
  );
}