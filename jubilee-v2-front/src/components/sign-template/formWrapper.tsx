import Button from "~/components/ui/Button";
import { Form } from "~/components/ui/Form";
import { IFormHookProps } from "~/types/form";
import { paths } from "~/router/paths";
import { useTranslation } from "react-i18next";
import { useForm } from "~/hooks/useForm";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as S from "./styles";
import PolicyTerms from "./policyTerms";

export type Props = {
  formConfig: any;
  buttonText: string;
  callback: (form: IFormHookProps) => void;
  forgotPassword?: boolean;
  signUp?: boolean;
};

const FormWrapper = ({
  formConfig,
  callback,
  buttonText,
  forgotPassword,
  signUp
}: Props) => {
  const { t } = useTranslation();
  const form = useForm(formConfig);
  const [searchParams] = useSearchParams();
  const values = form.getValues();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const hasNoValidate = formConfig.some((field: any) => field.noStandardValidationForm);
  const validationOnSubmit = formConfig.some((field: any) => field.validationOnSubmit);

  useEffect(() => {
    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
  
    if (typeof values.email === 'string' && values.email) {
      if (!validateEmail(values.email)) {
        form.setFieldError('email')(t('auth.invalid_email'));
      } else {
        form.setFieldError('email')('');
      }
    }
  }, [values.email, searchParams]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);
    callback(form);
  }

  const formState = useMemo(() => {
    if (validationOnSubmit && !isSubmitted) {
      return Object.fromEntries(
        Object.keys(form.formState).map((key) => [
          key,
          {
            error: null,
            value: form.formState[key]?.value ?? "",
          },
        ])
      );
    }
    return form.formState;
  }, [isSubmitted, validationOnSubmit, form.formState]);

  return (
    <S.Form onSubmit={handleSubmit} noValidate={hasNoValidate}>
      <Form {...form} noMargin formState={formState} />
      {forgotPassword && (
        <S.ForgotPassword>
          <S.LinkText to={paths.auth.forgot}>
            {t("auth.forgot_password.link")}
          </S.LinkText>
        </S.ForgotPassword>
      )}

      {signUp && <PolicyTerms />}
      <Button
        width="100%"
        type="submit"
        bgColor="primary"
        fontWeight={600}
        color="white">
        {buttonText}
      </Button>
    </S.Form>
  );
};

export default FormWrapper;
