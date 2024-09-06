import Button from "~/components/ui/Button";
import { Form } from "~/components/ui/Form";
import { IFormHookProps } from "~/types/form";
import { paths } from "~/router/paths";
import { useTranslation } from "react-i18next";
import { useForm } from "~/hooks/useForm";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as S from "./styles";

export type Props = {
  formConfig: any;
  callback: (form: IFormHookProps) => void;
  redirect: string;
  type: "reset_password" | "forgot_password" | "success";
};

const FormWrapper = ({ formConfig, callback, redirect, type }: Props) => {
  const { t } = useTranslation();
  const form = useForm(formConfig);
  const [searchParams] = useSearchParams();
  const values = form.getValues();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      searchParams.has("email") &&
      new RegExp(paths.auth.register).test(window.location.pathname)
    ) {
      const email = searchParams.get("email");
      let username = email?.split("@")[0];
      username = username?.replace(/[_\.]/g, " ");
      username = username
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      form.setFieldValue("email")(email);
      form.setFieldValue("name")(username);
      callback(form);
    }
  }, [searchParams, values.email]);

  return (
    <>
      {type !== "success" ? <Form {...form} noMargin /> : null}
      <S.ButtonContainer>
        {type !== "success" ? (
          <Button
            width="100%"
            onClick={() => navigate(redirect)}
            bgColor="white"
            style={{ border: "1px solid #e9e9e9" }}
            fontWeight={600}
            color="textDisabled">
            {t("auth.back")}
          </Button>
        ) : null}
        <Button
          width={type === "success" ? "270px" : "100%"}
          onClick={() => callback(form)}
          bgColor="primary"
          fontWeight={600}
          isDisabled={!values.email && type === "forgot_password"}
          color="white">
          {t(`auth.${type}.send`)}
        </Button>
      </S.ButtonContainer>
    </>
  );
};

export default FormWrapper;
