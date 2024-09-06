import { Form } from "~/components/ui/Form";
import { IFormHookProps } from "~/types/form";
import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import Separator from "~/components/ui/Separator";
import Button from "~/components/ui/Button";
import * as S from "./confirmPassword.style";
import Text from "~/components/ui/Text";
import { DefaultTFuncReturn } from "i18next";
import { paths } from "~/router/paths";
import { LinkText } from "~/components/sign-template/styles";

type Props = {
  handleAction: () => void;
  hide: () => void;
  title: string;
  form: IFormHookProps;
  buttonText: string;
  description?: DefaultTFuncReturn;
};

export const ConfirmPassword = ({
  handleAction,
  hide,
  title,
  form,
  buttonText,
  description,
}: Props) => {
  const { t } = useTranslation();

  return (
    <FlexContainer alignItems="flex-start" flexDirection="column">
      <S.Title>{title}</S.Title>
      {description ? <Text>{description}</Text> : ""}
      <S.FormContainer>
        <Form horizontalLabel {...form} />
      </S.FormContainer>
      <Separator type="horizontal" />
      <S.ForgotPasswordContainer>
          <LinkText to={paths.auth.forgot}>
            {t("auth.forgot_password.link")}
          </LinkText>
        </S.ForgotPasswordContainer>
      <S.Footer>
        <Button onClick={hide}>{t("settings.back")}</Button>
        <Button
          onClick={handleAction}
          color="white"
          bgColor="primary"
          size="lg">
          {buttonText}
        </Button>
      </S.Footer>
    </FlexContainer>
  );
};
