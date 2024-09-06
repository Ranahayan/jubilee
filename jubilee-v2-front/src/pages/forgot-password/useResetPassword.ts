import { useNavigate } from "react-router-dom";
import { resetPassword } from "~/api/account/requests";
import { paths } from "~/router/paths";
import { setJWT, setRefreshToken } from "~/helpers/auth";
import { useAccount } from "~/hooks/useAccount";
import { IFormHookProps } from "~/types/form";
import handleErrors from "~/helpers/handleErrors";
import { useTranslation } from "react-i18next";

// return token on hook
export const useResetPassword = (token: string) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAccount } = useAccount();

  return async (form: IFormHookProps) => {
    if (form.hasErrors) return;
    const values = form.getValues();
    if (!values || !values.password || !values.repeat_password) return;

    const toastMessages = {
      loading: t("auth.loading"),
      success: t("auth.success_resetPassword"),
      error: t("auth.error"),
    };

    const params = {
      token: token,
      password: values.password as string,
      repeat_password: values.repeat_password as string,
    };

    const { response } = await handleErrors(
      () => resetPassword(params),
      toastMessages
    );
    if (response) {
      await setJWT(response.access);
      await setRefreshToken(response.refresh);
      setAccount(response.user);
      navigate(paths.app.home);
    }
  };
};
