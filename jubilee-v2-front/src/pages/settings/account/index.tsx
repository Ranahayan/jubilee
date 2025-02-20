import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageDropdown } from "~/components/language-dropdown";
import { ConnectToStore } from "~/components/connect-to-store";
import { useForm } from "~/hooks/useForm";
import {
  emailFormConfig,
  formConfig,
  formConfigWithoutPassword,
  nameFormConfig,
} from "./form";
import { Form } from "~/components/ui/Form";
import { ConfirmPassword } from "~/components/confirm-password";
import { handlePassword } from "./HandlePassword";
import { settingsTabs } from "../tabs";
import { useStore } from "~/hooks/useStore";
import { useAccount } from "~/hooks/useAccount";
import { paths } from "~/router/paths";
import { logout } from "~/api/account/requests";
import { setJWT, setRefreshToken } from "~/helpers/auth";
import Tabs from "~/components/ui/Tabs";
import FlexContainer from "~/components/ui/FlexContainer";
import Separator from "~/components/ui/Separator";
import SettingsSection from "~/components/ui/SettingsSection";
import PageTitle from "~/components/ui/PageTitle";
import Button from "~/components/ui/Button";
import Modal from "~/components/ui/Modal";
import handleErrors from "~/helpers/handleErrors";
import { useQueryClient } from "@tanstack/react-query";
import * as S from "./styles";
import { faEnvelope } from "@fortawesome/pro-regular-svg-icons";
import { CreditCard } from "./CreditCard";
import { useUpdateDropshippingSettings } from "~/api/dropshipping/queries";

const AccountSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { store } = useStore();
  const { account, setAccount, getAccount } = useAccount();
  const { mutate: updateDropshippingSettings } = useUpdateDropshippingSettings();
  const navigate = useNavigate();
  const {forceRerender, ...form} = useForm(formConfig);
  const formWithoutPassword = useForm(formConfigWithoutPassword);
  const nameForm = useForm(nameFormConfig);
  const emailForm = useForm(emailFormConfig);

  const [show, setShow] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const hasPassword = account?.has_password;
  const client = useQueryClient();
  const showPasswordForm = hasPassword ? form : formWithoutPassword;

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    updateDropshippingSettings({ language: languageCode });
    forceRerender?.();
  };

  useEffect(() => {
    if (account) {
      nameForm.loadValues({ name: account.name });
      emailForm.loadValues({ email: account.email });
    }
  }, [account]);

  const logoutUser = async () => {
    const toastMessages = {
      loading: t("auth.loading"),
      success: t("settings.logout_succesfully"),
      error: t("auth.error"),
    };

    const { response } = await handleErrors(() => logout(), toastMessages);
    if (response) {
      client.clear();
      await setJWT("");
      await setRefreshToken("");
      setAccount(null);
      sessionStorage.clear();
      navigate(paths.auth.login);
    }
  };

  const setPasswordAndLogout = async () => {
    await handlePassword({
      form: formWithoutPassword,
      t,
      hasPassword,
      logout: logoutUser,
    });
  };

  const handlePasswordUpdate = async () => {
    try {
      if (nameForm.hasErrors || emailForm.hasErrors) return;
      const nameValues = nameForm.getValues();
      const emailValues = emailForm.getValues();

      await handlePassword({
        form: showPasswordForm,
        name: nameValues.name as string | undefined,
        email: emailValues.email as string | undefined,
        hasPassword,
        getAccount,
        t,
      });

      showPasswordForm.cleanValues();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisabledButton = useMemo(() => {
    if (!nameForm.isDirty && !emailForm.isDirty && !showPasswordForm.isDirty) return true;
    return false;
  }, [nameForm, emailForm, showPasswordForm]);

  return (
    <div>
      <PageTitle>{t("settings.title")}</PageTitle>
      <Tabs tabs={settingsTabs(account)} flexDirection="column">
        <SettingsSection
          leftSide={<S.SectionTitle>{t("settings.your_store")}</S.SectionTitle>}
          rightSide={
            store ? (
              <S.StyledAnchor
                href={`https://${store.url}`}
                target="_blank"
                rel="noopener noreferrer">
                {store.url}
              </S.StyledAnchor>
            ) : (
              <Button
                onClick={() => setShow(true)}
                color="white"
                bgColor="primary"
                padding="10px 18px"
                fontSize={1.5}
                fontWeight={600}>
                {t("connect.connect_store")}
              </Button>
            )
          }
        />

        <Separator type="horizontal" />

        <SettingsSection
          leftSide={
            <S.SectionTitle>{t("settings.account_name")}</S.SectionTitle>
          }
          rightSide={<Form {...nameForm} noMargin noInnerMargin />}
        />

        <Separator type="horizontal" />

        <SettingsSection
          leftSide={
            <S.SectionTitle>{t("settings.card_details")}</S.SectionTitle>
          }
          rightSide={
            <S.CreditCardContainer>
              <CreditCard account={account} />
            </S.CreditCardContainer>
          }
        />

        <Separator type="horizontal" />

        <SettingsSection
          leftSide={
            <S.SectionTitle>{t("settings.email_address")}</S.SectionTitle>
          }
          rightSide={
            <S.EmailContainer>
              <Form {...emailForm} noMargin noInnerMargin />
              <S.EmailIcon icon={faEnvelope} color="textSecondary" />
            </S.EmailContainer>
          }
        />

        <Separator type="horizontal" />

         <SettingsSection
          leftSide={<S.SectionTitle>{t("settings.language_preference")}</S.SectionTitle>}
          rightSide={
            <LanguageDropdown
              currentLanguage={i18n.language} onLanguageChange={handleLanguageChange}
            />
          }
        />

        <Separator type="horizontal" />

        <SettingsSection
          leftSide={<S.SectionTitle>{t("auth.password")}</S.SectionTitle>}
          rightSide={
            <FlexContainer
              flexDirection="column"
              gap={1.2}
              width="100%"
              alignItems="stretch">
              <Form {...showPasswordForm} noMargin />
              <Button
                bgColor="primaryLight"
                color="primary"
                alignSelf="flex-end"
                fontWeight={600}
                isDisabled={handleDisabledButton}
                onClick={handlePasswordUpdate}>
                {t("settings.save")}
              </Button>
            </FlexContainer>
          }
        />

        <Separator type="horizontal" />

        <SettingsSection
          leftSide={<S.SectionTitle>{t("settings.sign-out")}</S.SectionTitle>}
          rightSide={
            <Button
              onClick={() =>
                !hasPassword ? setShowConfirmModal(true) : logoutUser()
              }
              color="text"
              padding="10px 18px"
              bgColor="borderSecondary"
              fontSize={1.5}>
              {t("settings.sign-out")}
            </Button>
          }
        />
      </Tabs>

      <Modal
        id="connect-to-store"
        isShowing={show}
        hide={() => setShow(false)}
        padding="24px"
        minWidth="min(90%, 482px)">
        <ConnectToStore />
      </Modal>
      <Modal
        id="confirm-password"
        padding="32px"
        isShowing={showConfirmModal}
        hide={() => setShowConfirmModal(false)}>
        <ConfirmPassword
          title={t("settings.hold")}
          form={formWithoutPassword}
          buttonText={t("settings.logout")}
          description={t("settings.set_password")}
          hide={() => setShowConfirmModal(false)}
          handleAction={setPasswordAndLogout}
        />
      </Modal>
    </div>
  );
};

export default AccountSettingsPage;
