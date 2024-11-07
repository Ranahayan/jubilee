import { useState } from "react";
import { AddCardModal } from "~/components/add-card-modal/addCardModal";
import Modal from "~/components/ui/Modal";
import { useForm } from "~/hooks/useForm";
import { formConfig } from "./form";
import handleErrors from "~/helpers/handleErrors";
import { checkoutOrder } from "~/api/dropshipping/requests";
import { useAccount } from "~/hooks/useAccount";
import { useQueryClient } from "@tanstack/react-query";
import { ORDERS } from "~/api/dropshipping/types";
import { Trans, useTranslation } from "react-i18next";
import { updateCard } from "~/api/billing/requests";
import { toast } from "~/components/toast";
import { IShippingAddress, Status } from "~/types/dropshipping";
import FlexContainer from "~/components/ui/FlexContainer";
import { AddShippingInformation } from "~/components/add-shipping-info/addShippingInfo";
import { faFileLines } from "@fortawesome/pro-light-svg-icons";
import * as S from "../styles";
import { SVG } from "~/components/ui/SVG";


type Props = {
  sub_order_id: number;
  order_id: number;
  status: string;
  isSampleOrder?: boolean;
  isMoqValid: () => boolean;
  invalidItems: Array<{ moq_quantity: number; title: string }>;
};


export const CheckoutButton = ({ sub_order_id, status, isMoqValid, isSampleOrder, order_id, invalidItems }: Props) => {
	const form = useForm(formConfig);
	const { t } = useTranslation();
	const { getAccount, account } = useAccount();
	const [show, setShow] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
	const queryClient = useQueryClient();
	const invoiceUrl = `${import.meta.env.VITE_API_URL}/dropshipping/invoice/${sub_order_id}/`;
  const isUnpaid = status === Status.UNPAID;

  const handleCheckout = async () => {
    const toastMessages = {
			loading: t("orders.loading_checkout"),
			success: t("orders.success_checkout"),
			error: t("orders.error_checkout")
		};

    if (isSampleOrder && invalidItems.length > 0) {
      invalidItems.forEach((item) => {
        toast.error(
          <Trans
            i18nKey={"orders.moq_error"}
            values={{ moq: item.moq_quantity }}
          />
        );
      });

      return;
    }
  
		// If the user has not added a card, show the modal
    const account = await getAccount();
		if (!account?.stripe_card_digits) {
			return setShow(true);
		}

    if (!isMoqValid()) {
      return;
    }

    const { errors } = await handleErrors(
      () => checkoutOrder(sub_order_id),
      toastMessages
    );

    if (errors?.[0]?.includes("Address")) {
      setShowShippingModal(true);
      return;
    }
    queryClient.refetchQueries(ORDERS);
  };

  const handleAddCard = async () => {
    const values = form.getValues();

    if (!values.payment_method_id) {
      toast.error(t("checkout.provide_valid_card"));
      return;
    }

    const toastMessages = {
      loading: t("checkout.update_card"),
      success: t("checkout.update_success"),
      error: t("checkout.update_failed"),
    };

    if (show) {
      await handleErrors(() => updateCard({ ...values }), toastMessages);
      setShow(false);
      await getAccount();
      handleCheckout();
    } else {
      setShow(true);
    }
  };

  return (
    <FlexContainer>
      {!isUnpaid && (
        <S.IconButton onClick={() => window.open(invoiceUrl, "_blank")}>
          <SVG icon={faFileLines} size="lg" />
        </S.IconButton>
      )}

      {isUnpaid && (
        <S.ActionButton onClick={() => handleCheckout()}>
          {t("checkout.checkout")}
        </S.ActionButton>
      )}

      <Modal
        id="add-credit-card"
        hideCloseButton
        hide={() => setShow(!show)}
        isShowing={show}
        padding="20px">
        <AddCardModal
          handleClose={() => setShow(false)}
          handleAction={handleAddCard}
          form={form}
        />
      </Modal>

      <Modal
        id="add-shipping-info"
        hide={() => setShowShippingModal(false)}
        isShowing={showShippingModal}
        padding="24px 28px">
        <AddShippingInformation
          hide={() => setShowShippingModal(false)}
          order_id={order_id}
        />
      </Modal>
		</FlexContainer>
	)
};
