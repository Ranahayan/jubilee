import { useUpdateCustomization } from "~/api/account/queries";
import { CustomizationWrapper } from "~/components/ui/CustomizationWrapper";
import { mergeFields } from "~/components/ui/CustomizationWrapper/utils";
import { useForm } from "~/hooks/useForm";
import { config } from "./config";
import { paths } from "~/router/paths";
import handleErrors from "~/helpers/handleErrors";
import { useTranslation } from "react-i18next";

const CustomizationPage = () => {
  const { t } = useTranslation();
  const { mutateAsync: updateCustomization } = useUpdateCustomization();
  const allFields = mergeFields(config.tabs);
  const form = useForm(allFields);

  const handleAction = async () => {
    const values = form.getValues();
    const params = { ...values };
    const toastMessages = {
      loading: t("customization.loading"),
      success: t("customization.success"),
      error: t("customization.error"),
    };

    await handleErrors(() => updateCustomization(params), toastMessages);
  };

  return (
    <CustomizationWrapper
      form={form}
      handleAction={handleAction}
      returnUrl={paths.app.home}
      {...config}></CustomizationWrapper>
  );
};

export default CustomizationPage;
