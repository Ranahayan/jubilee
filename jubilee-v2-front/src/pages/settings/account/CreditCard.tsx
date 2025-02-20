import { faCreditCard } from "@fortawesome/pro-solid-svg-icons";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateCard } from "~/api/billing/queries";
import { useAccount } from "~/hooks/useAccount";
import { formConfig } from "~/pages/checkout/form";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import { Form } from "~/components/ui/Form";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import handleErrors from "~/helpers/handleErrors";
import { useForm } from "~/hooks/useForm";
import { IAccount } from "~/types/account";
import * as S from "./styles";
import { triggerGTMAddPaymentInfo } from "~/helpers/gtm";

type Props = {
  account: IAccount | null;
};

export const CreditCard = ({ account }: Props) => {
  const { t } = useTranslation();
  const { getAccount } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const { mutateAsync: updateCard } = useUpdateCard();
  const form = useForm(formConfig);

  const handleCard = async () => {
    const values = form.getValues();
    const toastMessages = {
      loading: t("checkout.update_card"),
      success: t("checkout.update_success"),
      error: t("checkout.update_failed"),
    };

    if (showForm || !account?.stripe_card_digits) {
      const { errors } = await handleErrors(
        () => updateCard({ ...values }),
        toastMessages
      );

      if (!errors) {
        setShowForm(false);
        getAccount();
        triggerGTMAddPaymentInfo();
      }
    } else {
      setShowForm(true);
    }
  };

  const inForm = showForm || !account?.stripe_card_digits;

  return (
    <Fragment>
      {inForm ? (
        <>
          <Form {...form} />
          <S.ButtonContainer>
            <Button
              onClick={handleCard}
              bgColor="primaryLight"
              color="primary"
              isDisabled={!form.isDirty}
              alignSelf="flex-end"
              fontWeight={600}>
              {t("checkout.save")}
            </Button>
          </S.ButtonContainer>
        </>
      ) : (
        <FlexContainer justifyContent="space-between">
          <FlexContainer justifyContent="flex-start">
            <SVG color="primary" icon={faCreditCard as SVGIcon} /> **** ****
            **** {account?.stripe_card_digits}
          </FlexContainer>
          <Button
            onClick={handleCard}
            bgColor="primaryLight"
            color="primary"
            alignSelf="flex-end"
            fontWeight={600}>
            {t("checkout.update")}
          </Button>
        </FlexContainer>
      )}
    </Fragment>
  );
};
