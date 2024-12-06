import FlexContainer from "~/components/ui/FlexContainer";
import Modal from "~/components/ui/Modal";
import Separator from "~/components/ui/Separator";
import { useTranslation } from "react-i18next";
import Text from "~/components/ui/Text";
import Button from "~/components/ui/Button";
import JhonyImg from "~/assets/png/jhony.png";

import * as S from "./styles";
import { SVG } from "~/components/ui/SVG";
import { faComments } from "@fortawesome/pro-regular-svg-icons";
import { useMediaQuery } from "~/hooks/useMediaQuery";

type HelpModalProps = {
  isShowing: boolean;
  hide: () => void;
  hidePause?: boolean;
  pauseSubscription: () => void;
  chatNow: () => void;
};

export const HelpModal = ({
  isShowing,
  hide,
  pauseSubscription,
  chatNow,
  hidePause,
}: HelpModalProps) => {
  const { t } = useTranslation();
  const isAboveTablet = useMediaQuery("tablet");

  return (
    <Modal id="help-modal" isShowing={isShowing} hide={hide} padding="24px">
      <FlexContainer
        width={isAboveTablet ? "600px" : "100%"}
        flexDirection="column"
        gap={2.4}
        justifyContent="flex-start"
        alignItems="flex-start">
        <S.Title>{t("cancel.want_help")}</S.Title>
        <Separator type="horizontal" />
        <FlexContainer
          gap={3.2}
          justifyContent="flex-start"
          alignItems="flex-start">
          <FlexContainer flexDirection="column" gap={1.2} width="120px">
            <img src={JhonyImg} style={{ height: "88px", width: "88px" }} />
            <S.CSName>{t("cancel.jhony")}</S.CSName>
            <Text>{t("cancel.cs_manager")}</Text>
          </FlexContainer>
          <Separator type="vertical" />
          <FlexContainer
            flexDirection="column"
            gap={2.4}
            justifyContent="flex-start"
            alignItems="flex-start">
            <S.DescText>{t("cancel.want_help_desc")}</S.DescText>
            <S.DescTextBold>{t("cancel.connect")}</S.DescTextBold>
            <FlexContainer flexDirection="column" width="100%">
              <Button
                style={{ fontWeight: 600 }}
                color="white"
                bgColor="green"
                width="100%"
                onClick={chatNow}
                radius="8px">
                <SVG icon={faComments} color="white" size="xl" />
                {t("cancel.chat_now")}
              </Button>
              {hidePause ? null : (
                <Button
                  style={{ borderColor: "green", fontWeight: 600 }}
                  color="green"
                  bgColor="transparent"
                  width="100%"
                  onClick={pauseSubscription}
                  radius="8px">
                  {t("cancel.pause_month")}
                </Button>
              )}
            </FlexContainer>
          </FlexContainer>
        </FlexContainer>
      </FlexContainer>
    </Modal>
  );
};
