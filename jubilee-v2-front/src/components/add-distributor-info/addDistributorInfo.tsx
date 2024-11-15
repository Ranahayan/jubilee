import { useTranslation } from "react-i18next";
import { formConfig } from "./distributorForm";
import { useDropshippingSettings, useUpdateDropshippingSettings } from "~/api/dropshipping/queries";
import { IDropshippingSettings } from "~/api/dropshipping/types";
import { useQueryClient } from "@tanstack/react-query";
import { DROPSHIPPING_SETTINGS } from "~/api/dropshipping/types";
import { useEffect } from "react";
import { useForm } from "~/hooks/useForm";
import handleErrors from "~/helpers/handleErrors";
import FlexContainer from "../ui/FlexContainer";
import { PageTitle } from "../plans/plans.style";
import Separator from "../ui/Separator";
import Text from "../ui/Text";
import { Form } from "../ui/Form";
import Button from "../ui/Button";

type Props = {
  handleAction: () => void;
}

export const AddDistributorInfo = ({ handleAction }: Props) => {
  const { t } = useTranslation();
  const form = useForm(formConfig);
  const { data, isLoading } = useDropshippingSettings();
  const { mutateAsync: updateSettings, isLoading: isSaving } = useUpdateDropshippingSettings();
  const client = useQueryClient();

  useEffect(() => {
    if (!isLoading && data) {
      const {
				brand_name,
				distributor_city,
				distributor_zip
			} = data;


      form.loadValues({
        brand_name,
				distributor_city,
				distributor_zip
			});
    }
  }, [data]);

  const handleSave = async () => {
    form.validate();
    const values = form.getValues();
    if (form.hasErrors || (!values.distributor_city || !values.distributor_zip || !values.brand_name))
      return;

		const payload: IDropshippingSettings = {shop: data?.shop, ...form.getValues()}

		const toastMessages = {
			error: t("dropshipping.distributor_error"),
			loading: t("dropshipping.distributor_loading"),
			success: t("dropshipping.distributor_success"),
		};

		await handleErrors(() => updateSettings(payload), toastMessages);
    client.invalidateQueries(DROPSHIPPING_SETTINGS);
    handleAction();
  };

  return (
    <FlexContainer flexDirection="column" justifyContent="flex-start" alignItems="flex-start">
      <PageTitle>{t("dropshipping.distributor_modal_title")}</PageTitle>
      <Separator type="horizontal" />
      <Text>{t("dropshipping.distributor_description")}</Text>
      <Form {...form} />
      <FlexContainer width="100%">
        <Button
          onClick={handleSave}
          color="white"
          bgColor="primary"
          width="100%"
        >
          {t("dropshipping.add_distributor")}
        </Button>
      </FlexContainer>
    </FlexContainer>
  );
}