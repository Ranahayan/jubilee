import * as S from "./styles";
import Logo from "~/assets/svg/logo.svg?react";
import FormWrapper from "./formWrapper";
import { FormFieldConfigs, IFormHookProps } from "~/types/form";
import PageTitle from "~/components/ui/PageTitle";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "@greatsumini/react-facebook-login";
import FacebookIcon from "~/assets/svg/facebook.svg?react";
import { useTranslation } from "react-i18next";
import { useSocialLogin } from "~/pages/login/useSocialLogin";
import { paths } from "~/router/paths";
import { useMediaQuery } from "~/hooks/useMediaQuery";

export type Props = {
  type: "signin" | "signup";
  callback: (form: IFormHookProps) => void;
  formConfig: FormFieldConfigs;
};

const HAS_GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_OAUTH_ID;
const HAS_FACEBOOK_ENABLED = !!import.meta.env.VITE_FACEBOOK_OAUTH_ID;

export const SignTemplate = ({ formConfig, callback, type }: Props) => {
  const { t } = useTranslation();
  const socialLogin = useSocialLogin();
  const isLaptop = useMediaQuery("laptop");
  const isTablet = useMediaQuery("tablet");
  const redirectTo = type === "signin" ? paths.auth.register : paths.auth.login;

  const handleGoogleLogin = async (response: any) => {
    const loginTokens = {
      id_token: response.credential,
      access_token: response.credential,
    };

    await socialLogin("google", loginTokens);
  };

  const handleFacebokLogin = async (response: any) => {
    const loginTokens = {
      id_token: response.userID,
      access_token: response.accessToken,
    };

    await socialLogin("facebook", loginTokens);
  };

  return (
    <S.Container>
      <S.TemplateContent>
        <S.Header>
          <Logo style={{ height: 30, width: "fit-content" }} />
        </S.Header>
        <S.LoginContainer>
          <S.FormContainer>
            <PageTitle>
              <b>{t(`auth.${type}.title`)}</b>
            </PageTitle>
            <S.SignText>
              {t(`auth.${type}.top_text`)}
              &nbsp;
              <S.LinkText to={redirectTo}>{t(`auth.${type}.link`)}</S.LinkText>
            </S.SignText>
            <FormWrapper
              formConfig={formConfig}
              callback={callback}
              buttonText={t(`auth.${type}.bottom_button`)}
              forgotPassword={type === "signin"}
              signUp={type === "signup"}
            />
          </S.FormContainer>
          {!HAS_GOOGLE_ENABLED && !HAS_FACEBOOK_ENABLED ? null : (
            <>
              <S.VerticalSeparator>
                <S.VerticalLine />
                <S.VerticalText>{t("auth.or")}</S.VerticalText>
                <S.VerticalLine />
              </S.VerticalSeparator>
              <S.HorizontalSeparator>
                <S.HorizontalLine />
                <S.VerticalText>{t("auth.or")}</S.VerticalText>
                <S.HorizontalLine />
              </S.HorizontalSeparator>
              <S.SocialContainer>
                {HAS_GOOGLE_ENABLED ? (
                  <GoogleLogin
                    width={isLaptop ? 380 : isTablet ? 330 : 300}
                    locale="en_US"
                    text={`${type}_with`}
                    logo_alignment="center"
                    onSuccess={handleGoogleLogin}
                  />
                ) : null}
                {HAS_FACEBOOK_ENABLED ? (
                  <FacebookLogin
                    appId={import.meta.env.VITE_FACEBOOK_OAUTH_ID}
                    onSuccess={handleFacebokLogin}
                    render={(renderProps) => (
                      <S.FacebookButton onClick={renderProps.onClick}>
                        <FacebookIcon />
                        &nbsp;
                        {t(`auth.${type}.with_facebook`)}
                      </S.FacebookButton>
                    )}
                  />
                ) : null}
              </S.SocialContainer>
            </>
          )}
        </S.LoginContainer>
      </S.TemplateContent>
    </S.Container>
  );
};
