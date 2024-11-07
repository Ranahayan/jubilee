import FlexContainer from "~/components/ui/FlexContainer";
import Text from "~/components/ui/Text";
import { SVG } from "~/components/ui/SVG";
import { faPlus, faTrash } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "~/components/ui/SVG/types";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import Modal from "~/components/ui/Modal";
import { AddShippingInformation } from "~/components/add-shipping-info/addShippingInfo";
import { ShowCustomerDetails } from "~/components/show-customer-details/showCustomerDetails";
import { ISupplier, Status } from "~/types/dropshipping";
import * as S from "../styles";
import { useMediaQuery } from "~/hooks/useMediaQuery";

interface IHeader {
  order_date: string;
  order_number?: string;
  supplier?: string | ISupplier;
  isSampleOrder?: boolean;
  status?: string;
  order_id: number;
  customer: string;
  customer_phone?: string;
  shipping_address?: string;
  deleteDraft?: (id: string) => void;
  isSelected: boolean;
  onToggle: () => void;
}

interface UserInformation {
  customer: string;
  customer_phone?: string;
  shipping_address?: string;
}

const UserInformation = ({
  customer,
  customer_phone,
  shipping_address,
}: UserInformation) => {
  const { t } = useTranslation();
  if (!customer && !shipping_address) return null;

  return (
    <FlexContainer>
      {customer && (
        <FlexContainer alignItems="flex-end" flexDirection="column" gap={0.3}>
          <Text secondary>{t("orders.customer")}</Text>
          <Text>
            <strong>{customer}</strong>
          </Text>
          <Text>
            <strong>{customer_phone}</strong>
          </Text>
        </FlexContainer>
      )}

      {shipping_address && (
        <FlexContainer alignItems="flex-end" flexDirection="column" gap={0.3}>
          <Text secondary>{t("orders.shipping")}</Text>
          <S.StyledText>
            <strong>{shipping_address}</strong>
          </S.StyledText>
        </FlexContainer>
      )}
    </FlexContainer>
  );
};

export const Header = ({
  order_date,
  order_number,
  order_id,
  supplier,
  customer,
  customer_phone,
  shipping_address,
  deleteDraft,
  isSampleOrder,
  status,
  isSelected,
  onToggle,
}: IHeader) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const handleShowCustomerModal = () => {
    setShowCustomerModal(true);
  };

  const handleShowAddressModal = () => {
    setShow(true);
  };

  const isTablet = useMediaQuery("tablet");

  return (
    <FlexContainer
      width="100%"
      flexDirection="column"
      alignItems="flex-start"
      gap={0.2}>
      <S.OrderHeaderContainer>
        <FlexContainer flexDirection="row" alignItems="flex-start">
          <FlexContainer
            flexDirection="column"
            justifyContent="flex-start"
            padding={"4px 0 0 0"}>
            <input
              disabled={status !== "unpaid" || !customer}
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
            />
          </FlexContainer>
          <FlexContainer gap={2.4}>
            <FlexContainer
              flexDirection="column"
              alignItems="flex-start"
              gap={0.3}>
              <FlexContainer gap={0.6}>
                <Text>
                  Order No. <strong>{order_number || order_id}</strong>
                </Text>

                {isSampleOrder && (
                  <S.SampleOrderTag>
                    {t("orders.sample_order")}
                  </S.SampleOrderTag>
                )}
              </FlexContainer>
              <FlexContainer gap={1.4}>
                <Text>
                  Date: <strong>{order_date}</strong>
                </Text>

                {isSampleOrder ? (
                  <Text>
                    {t("orders.supplier")}:{" "}
                    <strong>{supplier as string}</strong>
                  </Text>
                ) : null}
              </FlexContainer>
            </FlexContainer>
          </FlexContainer>
        </FlexContainer>
        <FlexContainer gap={2.4}>
          {!customer && (
            <S.OutlineButton onClick={handleShowAddressModal}>
              <SVG icon={faPlus as SVGIcon} color="text" />
              <Text>{t("orders.add_shipping")}</Text>
            </S.OutlineButton>
          )}

          {!!customer && (!isSampleOrder || !isTablet) && (
            <S.OutlineButton onClick={handleShowCustomerModal}>
              {t("orders.customer-info")}
            </S.OutlineButton>
          )}
        </FlexContainer>

        {isSampleOrder && isTablet && !!customer && (
          <UserInformation
            customer={customer}
            customer_phone={customer_phone}
            shipping_address={shipping_address}
          />
        )}
      </S.OrderHeaderContainer>

      {deleteDraft && status === Status.UNPAID && (
        <S.FlexContainerPointed>
          <SVG icon={faTrash as SVGIcon} color="text" />
          <Text>{t("orders.delete_draft")}</Text>
        </S.FlexContainerPointed>
      )}

      <Modal
        id="add-shipping-info"
        maxHeight="90%"
        hideCloseButton
        hide={() => setShow(!show)}
        isShowing={show}
        padding="24px 28px">
        <AddShippingInformation
          hide={() => setShow(false)}
          order_id={order_id}
        />
      </Modal>

      <Modal
        id="show-customer-details"
        hideCloseButton
        hide={() => setShowCustomerModal(false)}
        isShowing={showCustomerModal}
        padding="24px 28px">
        <ShowCustomerDetails
          hide={() => setShowCustomerModal(false)}
          customer={customer}
          phone={customer_phone}
          address={shipping_address}
        />
      </Modal>
    </FlexContainer>
  );
};
