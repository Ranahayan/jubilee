import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useResetPassword } from "./useResetPassword";
import { IFormHookProps } from "~/types/form";
import { formConfigEmail, formConfigReset } from "./form";
import handleErrors from "~/helpers/handleErrors";
import { resetPasswordEmail } from "~/api/account/requests";
import { ForgotPasswordTemplate } from "~/components/forgot-password";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token") || "";
  const resetPassword = useResetPassword(token);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const sendEmail = async (form: IFormHookProps) => {
    if (form.hasErrors) return;
    const values = form.getValues();
    if (!values || !values.email) return;

    const toastMessages = {
      loading: t("auth.loading"),
      success: t("auth.success_reset"),
      error: t("auth.error"),
    };

    const params = {
      email: values.email as string,
    };

    const { errors } = await handleErrors(
      () => resetPasswordEmail(params),
      toastMessages
    );

    if (!errors) {
      setIsFormSubmitted(true);
    }
  };

  const getTemplateType = () => {
    if (isFormSubmitted) {
      return "success";
    }

    if (token) {
      return "reset_password";
    }

    return "forgot_password";
  };

  return (
    <ForgotPasswordTemplate
      type={getTemplateType()}
      formConfig={token ? formConfigReset : formConfigEmail}
      callback={token ? resetPassword : sendEmail}
    />
  );
};

export default ForgotPasswordPage;
