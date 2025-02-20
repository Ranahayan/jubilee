import { Fragment, useMemo, useState } from "react";
import Tabs from "~/components/ui/Tabs";
import { settingsTabs } from "../tabs";
import PageTitle from "~/components/ui/PageTitle";
import SettingsSection from "~/components/ui/SettingsSection";
import Label from "~/components/ui/Label";
import Text from "~/components/ui/Text";
import { Trans, useTranslation } from "react-i18next";
import { MembershipInformation } from "./membershipInformation";
import Separator from "~/components/ui/Separator";
import handleErrors from "~/helpers/handleErrors";
import { resumeSubscription } from "~/api/billing/requests";
import Container from "~/components/ui/Container";
import Table from "~/components/ui/Table";
import { columns } from "./table";
import { useInvoices } from "~/api/billing/queries";
import { Invoice, InvoiceStatus, SubscriptionType } from "~/types/billing";
import Loader from "~/components/ui/Loader";
import { usePaymentMethod } from "~/hooks/usePaymentMethod";
import { DialogModal } from "~/components/ui/DialogModal";
import { faArrowRotateRight } from "@fortawesome/pro-solid-svg-icons";

import * as S from "~/pages/settings/membership/styles";
import { ConfirmCancelModal } from "~/components/confirmCancelModal";
import { PauseExceededWarningModal } from "~/components/pauseExceededWarningModal";
import Modal from "~/components/ui/Modal";
import { paths } from "~/router/paths";
import { useNavigate } from "react-router-dom";
import { useAccount } from "~/hooks/useAccount";
import { PauseModal } from "./pauseModal";
import dayjs from "dayjs";
import { PlanStatus } from "~/types/account";

const MembershipSettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isUserShopify, isUserStripe } = usePaymentMethod();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showPauseExceededModal, setShowPauseExceededModal] = useState(false);
  const { account, getAccount } = useAccount();
  const { data, isLoading } = useInvoices();
  const filteredInvoices: Invoice[] | undefined = data?.filter(
    (elm) => elm.status === InvoiceStatus.SUCCESS
  );
  const trialEndDate = dayjs(account?.active_subscription?.trial_end_at);
  const now = dayjs();
  const isInTrial = trialEndDate > now;
  const isCancelled = account?.active_subscription?.cancel_at;
  const isSubscriptionPaused = account?.active_subscription?.paused_at;
  const isAnnual =
    account?.active_subscription?.plan?.interval === SubscriptionType.ANNUAL;
  const remainingPausesMessage = useMemo(() => {
    const maxPauses = 2;
    const remainingPauses = maxPauses - (account?.pause_count || 0);
    if (isAnnual || isUserShopify || !account?.active_subscription || isInTrial)
      return null;
    return remainingPauses !== 0
      ? `${t("settings.able_to_pause")} ${
          remainingPauses === 1
            ? t("settings.pause_once")
            : t("settings.pause_twice")
        }`
      : null;
  }, [account?.pause_count, isAnnual, isUserShopify]);
  const hasPassword = account?.has_password;
  const hidePause = useMemo(() => {
    const isPastDue =
      account?.last_subscription?.status === PlanStatus.PAST_DUE;
    return (
      isAnnual ||
      isUserShopify ||
      isPastDue ||
      !account?.active_subscription ||
      isInTrial
    );
  }, [isUserShopify, account]);

  const handleResume = async () => {
    const toastMessages = {
      loading: t("settings.loading_unpause"),
      success: t("settings.unpause_success"),
      error: t("settings.unpause_error"),
    };

    const { errors } = await handleErrors(
      () => resumeSubscription(),
      toastMessages
    );

    if (!errors) {
      setTimeout(() => {
        getAccount();
      }, 500);
    }
  };

  const handlePasswordError = () => {
    navigate(paths.settings.account);
  };

  const handleCancelPlan = () => {
    // If user doesn't have a password, show create password modal
    if (!hasPassword) return setShowPasswordModal(true);
    // If user is annual or from shopify, or user already paused twice or it is in trial, show only cancel modal without "maybe pause" modal
    if (
      isAnnual ||
      isUserShopify ||
      (account?.pause_count || 0) >= 2 ||
      isInTrial
    ) {
      setShowModal(true);
    } else {
      setShowCancelModal(true);
    }
  };

  return (
    <div>
      <PageTitle>{t("settings.title")}</PageTitle>
      <Tabs tabs={settingsTabs(account)} flexDirection="column">
        <SettingsSection
          leftSide={
            <Label
              alignItems="flex-start"
              text={t("settings.membership_information")}>
              <Text secondary>
                <Trans
                  i18nKey="settings.membership_information_subtitle"
                  components={{
                    1: (
                      <S.StyledClickableText
                        onClick={() =>
                          (account?.pause_count || 0) >= 2
                            ? setShowPauseExceededModal(true)
                            : setShowPauseModal(true)
                        }
                      />
                    ),
                    2: <S.StyledClickableText onClick={handleCancelPlan} />,
                    3: (
                      <S.ShowMembershipText
                        display={
                          (account?.active_subscription ||
                            account?.last_subscription?.status ===
                              PlanStatus.PAST_DUE) &&
                          !isSubscriptionPaused &&
                          !isCancelled
                            ? "block"
                            : "none"
                        }
                      />
                    ),
                    hide_pause: hidePause ? (
                      <div style={{ display: "none" }} />
                    ) : (
                      <Fragment />
                    ),
                  }}
                />
              </Text>
              <Text secondary>{remainingPausesMessage}</Text>
            </Label>
          }
          rightSide={
            <MembershipInformation
              isShowing={showModal}
              hide={() => setShowModal(false)}
              latestSubscriptionHistory={data?.[0]?.subscription_history}
              resumeSubscription={() => setShowResumeModal(true)}
            />
          }
        />
        <Separator type="horizontal" />

        {isUserStripe ? (
          <Container
            padding="30px 0px"
            justifyContent="flex-start"
            alignItems="flex-start"
            width="100%"
            flexDirection="column">
            <Label alignItems="flex-start" text={t("settings.billing_history")}>
              <Text secondary>
                {!data ? t("settings.no_invoice") : t("settings.billing_info")}
              </Text>
            </Label>

            {data ? (
              <Table
                columns={columns(t)}
                data={filteredInvoices as Invoice[]}
                padding="0"
                headerBg="borderSecondary"
              />
            ) : null}

            {isLoading ? <Loader /> : null}
          </Container>
        ) : null}
      </Tabs>
      <DialogModal
        id="resume-subscription"
        title={t("settings.resume_modal_title")}
        description={t("settings.resume_modal_desc")}
        buttonText={t("settings.unpause")}
        buttonColor="primary"
        buttonCancelText={t("settings.go_back")}
        handleAction={handleResume}
        isShowing={showResumeModal}
        hide={() => setShowResumeModal(false)}
        icon={faArrowRotateRight}
      />
      <PauseModal
        isShowing={showPauseModal}
        hide={() => setShowPauseModal(false)}
      />
      <ConfirmCancelModal
        handlePause={() => setShowPauseModal(!showPauseModal)}
        handleCancel={() => setShowModal(!showModal)}
        isShowing={showCancelModal}
        hide={() => setShowCancelModal(!showCancelModal)}
      />
      <PauseExceededWarningModal
        isShowing={showPauseExceededModal}
        hide={() => setShowPauseExceededModal(false)}
      />

      <Modal
        id="create-password"
        isShowing={showPasswordModal}
        hide={() => setShowPasswordModal(false)}
        padding="32px 24px">
        <S.FlexContainerStyled
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="flex-start">
          <S.SetPasswordTitle>
            {t("settings.create_password")}
          </S.SetPasswordTitle>
          <Text secondary>
            <Trans
              i18nKey="settings.password_required"
              components={{ 1: <S.StyledLink onClick={handlePasswordError} /> }}
            />
          </Text>
        </S.FlexContainerStyled>
      </Modal>
    </div>
  );
};

export default MembershipSettingsPage;
