import { Trans, useTranslation } from "react-i18next";
import * as S from "./styles";
import Logo from "~/assets/svg/logo.svg?react";
import FlexContainer from "~/components/ui/FlexContainer";
import Button from "~/components/ui/Button";
import { SVG } from "~/components/ui/SVG";
import { faXmarkCircle } from "@fortawesome/pro-regular-svg-icons";
import Text from "~/components/ui/Text";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { faLeftToLine } from "@fortawesome/pro-solid-svg-icons";
import RadioButton from "~/components/ui/Radio";
import CustomCheckbox from "~/components/ui/Checkbox";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import { PauseModal } from "../settings/membership/pauseModal";
import { PauseExceededWarningModal } from "~/components/pauseExceededWarningModal";
import { useAccount } from "~/hooks/useAccount";
import PausePlanImg from "~/assets/svg/pause-plan.svg";
import JhonyImg from "~/assets/png/jhony.png";
import { HelpModal } from "./components/HelpModal";
import { ImproveModal } from "./components/ImproveModal";
import { ExtendTrialModal } from "./components/ExtendTrialModal";
import {
  LeavingOptions,
  LeavingReasons,
  LostOptions,
  ModalTypes,
} from "~/constants/cancel";
import { CancelSureModal } from "./components/CancelSureModal";
import { useCancellationInfo } from "~/api/billing/queries";
import { SubscriptionType } from "~/types/billing";
import { usePaymentMethod } from "~/hooks/usePaymentMethod";
import dayjs from "dayjs";
import { useIntercom } from "react-use-intercom";
import { PlanStatus } from "~/types/account";

const CancelationPage = () => {
  const { t } = useTranslation();
  const { account } = useAccount();
  const navigate = useNavigate();
  const isAboveTablet = useMediaQuery("tablet");
  const [showModal, setShowModal] = useState<ModalTypes | null>(
    ModalTypes.EXTEND
  );
  const { show } = useIntercom(); 
  const [cancelCheck, setCancelCheck] = useState(false);
  const [reason, setReason] = useState<LeavingOptions>();
  const [returningCustomer, setReturningCustomer] = useState<number>(0);
  const [text, setText] = useState("");
  const arrayFromOneToTen = Array.from({ length: 10 }, (_, i) => i + 1);
  const { mutateAsync: cancellationInfo } = useCancellationInfo();
  const { isUserShopify } = usePaymentMethod();
  const hidePause = useMemo(() => {
    const isAnnual =
      account?.active_subscription?.plan?.interval === SubscriptionType.ANNUAL;
    const isPastDue = account?.last_subscription?.status === PlanStatus.PAST_DUE;
    const trialEndDate = dayjs(account?.active_subscription?.trial_end_at);
    const now = dayjs();
    const isInTrial = trialEndDate > now;
    return (
      isAnnual || isUserShopify || !account?.active_subscription || isInTrial || isPastDue
    );
  }, [isUserShopify, account]);

  useEffect(() => {
    if (reason === LeavingOptions.BILLING) setShowModal(ModalTypes.HELP);
    if (reason === LeavingOptions.NOT_SURE) setShowModal(ModalTypes.IMPROVE);
  }, [reason]);

  const handleCancelInfo = async () => {
    const payload = {
      reason: reason,
      returning: returningCustomer,
      notes: text,
    };

    await cancellationInfo(payload);
  };

  return (
    <S.CancelationContainer>
      <Logo style={{ height: 28, width: "fit-content", margin: 24 }} />
      <S.ContentContainer>
        <S.Title>
          <Trans i18nKey="cancel.title" components={{ 1: <S.TitleBold /> }} />
        </S.Title>
        {hidePause ? null : (
          <S.Content>
            <FlexContainer
              justifyContent="space-between"
              flexDirection={isAboveTablet ? "row" : "column"}>
              <FlexContainer flexDirection="column" alignItems="flex-start">
                <S.RecommendedFlag>{t("cancel.recommended")}</S.RecommendedFlag>
                <S.ContentTitle>{t("cancel.pause_title")}</S.ContentTitle>
                <S.PauseDescription>
                  {t("cancel.pause_desc")}
                </S.PauseDescription>
              </FlexContainer>

              <Button
                bgColor="green"
                color="white"
                padding="14px 64px"
                radius="71px"
                onClick={() =>
                  (account?.pause_count || 0) >= 2
                    ? setShowModal(ModalTypes.EXCEEDED)
                    : setShowModal(ModalTypes.PAUSE)
                }
                alignSelf="center">
                {t("cancel.pause_now")}
              </Button>
            </FlexContainer>
          </S.Content>
        )}
        <FlexContainer
          flexDirection={isAboveTablet ? "row" : "column"}
          width="100%"
          gap="34px"
          alignItems="flex-start">
          <S.Content>
            <S.PausePlanImgContainer>
              <img src={PausePlanImg} />
            </S.PausePlanImgContainer>
            <S.ContentTitle>{t("cancel.lose")}</S.ContentTitle>
            <FlexContainer
              height="110px"
              flexDirection="column"
              alignItems="flex-start"
              flexWrap="wrap">
              {LostOptions.map((option, index) => (
                <FlexContainer key={index} justifyContent="flex-start">
                  <SVG icon={faXmarkCircle} color="red" />
                  <Text>{t(option)}</Text>
                </FlexContainer>
              ))}
            </FlexContainer>
          </S.Content>
          <S.Content>
            <img src={JhonyImg} style={{ height: "60px", width: "60px" }} />
            <S.ContentTitle>{t("cancel.help")}</S.ContentTitle>
            <FlexContainer
              flexDirection="column"
              alignItems="flex-start"
              gap="32px">
              <S.HelpText>{t("cancel.help_desc_1")}</S.HelpText>
              <S.HelpText>{t("cancel.help_desc_2")}</S.HelpText>
              <FlexContainer
                alignItems="flex-start"
                flexDirection="column"
                gap="2px">
                <S.HelpTextBold>{t("cancel.jhony")}</S.HelpTextBold>
                <S.HelpText>{t("cancel.customer")}</S.HelpText>
              </FlexContainer>
            </FlexContainer>
          </S.Content>
        </FlexContainer>
        <S.ImportantContainer>
          <S.ImportantText>{t("cancel.important")}</S.ImportantText>
          <Button
            bgColor="green"
            color="white"
            padding="14px 38px"
            style={{ fontSize: "16px", fontWeight: "500" }}
            radius="71px"
            onClick={() => navigate(paths.app.home)}
            alignSelf="center">
            <SVG icon={faLeftToLine} color="white" size="xl" />
            {t("cancel.nevermind")}
          </Button>
        </S.ImportantContainer>
        <S.Content>
          <FlexContainer alignItems="flex-start" justifyContent="space-between">
            <FlexContainer
              width="386px"
              flexDirection="column"
              alignItems="flex-start"
              justifyContent="flex-start">
              <S.RequiredFlag>{t("cancel.required")}</S.RequiredFlag>
              <S.ContentTitle>{t("cancel.share_reason")}</S.ContentTitle>
            </FlexContainer>
            <FlexContainer
              flexDirection="column"
              alignItems="flex-start"
              justifyContent="flex-start">
              {LeavingReasons.map((elm, index) => (
                <RadioButton
                  key={index}
                  label={t(elm.label) as string}
                  checked={elm.value === reason}
                  onChange={() => setReason(elm.value)}
                />
              ))}
            </FlexContainer>
          </FlexContainer>
        </S.Content>
        <S.Content>
          <FlexContainer alignItems="flex-start" justifyContent="space-between">
            <FlexContainer
              width="386px"
              flexDirection="column"
              alignItems="flex-start"
              justifyContent="flex-start">
              <S.RequiredFlag>{t("cancel.required")}</S.RequiredFlag>
              <S.ContentTitle>{t("cancel.return")}</S.ContentTitle>
            </FlexContainer>

            <FlexContainer
              alignItems="flex-start"
              justifyContent="flex-start"
              flexDirection="column">
              <FlexContainer justifyContent="space-between" width="100%">
                <Text secondary>{t("cancel.chance")}</Text>
                <Text secondary>{t("cancel.absolutely")}</Text>
              </FlexContainer>
              <FlexContainer gap="18px">
                {arrayFromOneToTen.map((elm, index) => (
                  <FlexContainer
                    flexDirection="column"
                    key={index}
                    //@ts-ignore
                    onClick={() => setReturningCustomer(elm)}>
                    <RadioButton
                      checked={returningCustomer === elm}
                      onChange={() => setReturningCustomer(elm)}
                    />
                    <Text secondary>{elm}</Text>
                  </FlexContainer>
                ))}
              </FlexContainer>
            </FlexContainer>
          </FlexContainer>
        </S.Content>
        <S.Content>
          <FlexContainer alignItems="flex-start" justifyContent="space-between">
            <FlexContainer
              width="386px"
              alignItems="flex-start"
              justifyContent="flex-start">
              <S.ContentTitle>{t("cancel.exp")}</S.ContentTitle>
            </FlexContainer>

            <FlexContainer
              flexDirection="column"
              alignItems="flex-start"
              width="424px"
              justifyContent="flex-start">
              <S.StyledTextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("cancel.text_placeholder") as string}
              />
            </FlexContainer>
          </FlexContainer>
        </S.Content>
        <FlexContainer width="100%" flexDirection="column" gap="21px">
          <CustomCheckbox
            label={t("cancel.understand") as string}
            checked={cancelCheck}
            onChange={() => setCancelCheck(!cancelCheck)}
          />
          <Button
            bgColor="green"
            color="white"
            padding="14px"
            width="100%"
            radius="71px"
            onClick={() => navigate(paths.app.home)}
            style={{ fontSize: "16px", fontWeight: "500" }}>
            <SVG icon={faLeftToLine} color="white" size="xl" />
            {t("cancel.nevermind")}
          </Button>
          <Button
            bgColor="transparent"
            color="red"
            padding="14px"
            width="100%"
            radius="71px"
            isDisabled={!cancelCheck || !reason || !returningCustomer}
            onClick={() => setShowModal(ModalTypes.SURE)}
            style={{ fontSize: "16px", fontWeight: "500" }}>
            <SVG icon={faXmarkCircle} color="red" size="xl" />
            {t("cancel.cancel_account")}
          </Button>
        </FlexContainer>
      </S.ContentContainer>

      <PauseModal
        isShowing={showModal === ModalTypes.PAUSE}
        hide={() => setShowModal(null)}
        redirect={() => navigate(paths.settings.plan)}
      />
      <PauseExceededWarningModal
        isShowing={showModal === ModalTypes.EXCEEDED}
        hide={() => setShowModal(null)}
      />
      <HelpModal
        isShowing={showModal === ModalTypes.HELP}
        hide={() => setShowModal(null)}
        hidePause={hidePause}
        pauseSubscription={() => setShowModal(ModalTypes.PAUSE)}
        chatNow={() => show()}
      />
      <ImproveModal
        isShowing={showModal === ModalTypes.IMPROVE}
        hide={() => setShowModal(null)}
        pauseSubscription={() => setShowModal(ModalTypes.PAUSE)}
        hidePause={hidePause}
        chatNow={() => show()}
      />
      <ExtendTrialModal
        isShowing={showModal === ModalTypes.EXTEND}
        hide={() => setShowModal(null)}
        pauseSubscription={() => setShowModal(ModalTypes.PAUSE)}
        hidePause={hidePause}
        extend={() => show()}
      />
      <CancelSureModal
        isShowing={showModal === ModalTypes.SURE}
        hide={() => setShowModal(null)}
        saveInfo={handleCancelInfo}
      />
    </S.CancelationContainer>
  );
};

export default CancelationPage;
