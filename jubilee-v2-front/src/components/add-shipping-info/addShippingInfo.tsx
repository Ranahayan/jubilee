import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updateAddress } from "~/api/dropshipping/requests";
import { ORDERS } from "~/api/dropshipping/types";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import { Form } from "~/components/ui/Form";
import handleErrors from "~/helpers/handleErrors";
import { faUser } from "@fortawesome/pro-light-svg-icons";
import * as S from "./styles";
import { SVG } from "~/components/ui/SVG";
import { formConfigShipping } from "~/pages/orders/shippingForm";
import { useForm } from "~/hooks/useForm";

type Props = {
  hide: () => void;
  order_id: number;
};

export const AddShippingInformation = ({ hide, order_id }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const form = useForm(formConfigShipping);

  const handleUpdateAddress = async () => {
    const values = form.getValues();
    const toastMessage = {
      loading: t("dropshipping.updating_address"),
      success: t("dropshipping.address_updated"),
      error: t("dropshipping.address_error"),
    };

    const payload = {
      first_name: values.first_name as string,
      last_name: values.last_name as string,
      line_1: values.line_1 as string,
      line_2: values.line_2 as string,
      city: values.city as string,
      state: values.state as string,
      country: values.country as string,
      zip: values.zip as string,
      phone: values.phone as string,
      order_id: order_id,
    };

    const { response } = await handleErrors(
      () => updateAddress(payload),
      toastMessage
    );
    if (response?.message?.includes("success")) {
      queryClient.refetchQueries(ORDERS);
      hide();
    }
  };

  return (
    <S.Container>
      <S.Icon>
        <SVG icon={faUser} size="xl" />
      </S.Icon>
      <S.Title>{t("orders.customer_info")}</S.Title>
      <Form {...form} />
      <FlexContainer width="100%" justifyContent="flex-end">
        <S.BackButton
          color="text"
          padding="9px 29px"
          onClick={hide}
        >
          {t("orders.cancel")}
        </S.BackButton>
        <Button
          color="white"
          bgColor="primary"
          padding="9px 29px"
          width="100%"
          onClick={handleUpdateAddress}
        >
          {t("orders.save")}
        </Button>
      </FlexContainer>
    </S.Container>
  );
};
