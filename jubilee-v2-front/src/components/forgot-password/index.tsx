import * as S from "./styles";
import Logo from "~/assets/svg/logo.svg?react";
import FormWrapper from "./formWrapper";
import { FormFieldConfigs, IFormHookProps } from "~/types/form";
import PageTitle from "~/components/ui/PageTitle";
import { useTranslation } from "react-i18next";
import { paths } from "~/router/paths";
import { useNavigate } from "react-router-dom";

export type Props = {
  type: "reset_password" | "forgot_password" | "success";
  callback: (form: IFormHookProps) => void;
  formConfig: FormFieldConfigs;
};

export const ForgotPasswordTemplate = ({
  type,
  formConfig,
  callback,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCallback = (form: IFormHookProps) => {
    if (type === "success") {
      return navigate(paths.auth.login);
    }

    callback(form);
  };

  return (
    <S.Container>
      <S.TemplateContent>
        <S.Header>
          <Logo style={{ height: 30, width: "fit-content" }} />
        </S.Header>
        <S.LoginContainer>
          <S.FormContainer>
            <PageTitle justifyContent="center">
              <b>{t(`auth.${type}.title`)}</b>
            </PageTitle>
            <S.SignText>{t(`auth.${type}.description`)}</S.SignText>
            <FormWrapper
              redirect={paths.auth.login}
              formConfig={formConfig}
              callback={handleCallback}
              type={type}
            />
          </S.FormContainer>
        </S.LoginContainer>
      </S.TemplateContent>
    </S.Container>
  );
};
