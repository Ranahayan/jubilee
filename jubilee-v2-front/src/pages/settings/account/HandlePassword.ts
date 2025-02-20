import { TFunction } from "i18next";
import { changePassword, editProfile } from "~/api/account/requests";
import handleErrors from "~/helpers/handleErrors";
import { IFormHookProps } from "~/types/form";

type Props = {
  form: IFormHookProps;
  name?: string;
  email?: string;
  t: TFunction;
  hasPassword?: boolean;
  logout?: () => void;
  getAccount?: () => void;
};

export const handlePassword = async ({
  form,
  name,
  email,
  t,
  hasPassword,
  logout,
  getAccount,
}: Props) => {
  if (form.hasErrors) return;
  const values = form.getValues();
  if (!values) return;

  const old_password = values.old_password as string | undefined;
  const new_password1 = values.new_password1 as string;
  const new_password2 = values.new_password2 as string;
  const lowerEmail = email?.toLowerCase();

  const action =
    new_password1 && new_password2
      ? () =>
          changePassword({
            old_password,
            new_password1,
            new_password2,
            name,
            email: lowerEmail,
          })
      : () => editProfile({ name, email: lowerEmail });

  const toastMessages = {
    loading: t("settings.changing"),
    success: t("settings.change_success"),
    error: t("auth.error"),
  };

  const { errors } = await handleErrors(action, toastMessages);
  if (!errors) {
    logout ? logout() : null;
    getAccount ? getAccount() : null;
  }
};
