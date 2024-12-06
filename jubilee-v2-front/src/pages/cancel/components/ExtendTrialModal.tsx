import FlexContainer from "~/components/ui/FlexContainer";
import Modal from "~/components/ui/Modal";
import Separator from "~/components/ui/Separator";
import { useTranslation } from "react-i18next";
import Text from "~/components/ui/Text";
import Button from "~/components/ui/Button";
import JhonyImg from "~/assets/png/jhony.png";

import * as S from "./styles";
import { SVG } from "~/components/ui/SVG";
import { faCalendarCirclePlus } from "@fortawesome/pro-regular-svg-icons";
import { useMediaQuery } from "~/hooks/useMediaQuery";

type ExtendTrialModalProps = {
  isShowing: boolean;
  hide: () => void;
  hidePause?: boolean;
  pauseSubscription: () => void;
  extend: () => void;
};

export const ExtendTrialModal = ({
  isShowing,
  hide,
  pauseSubscription,
  extend,
  hidePause,
}: ExtendTrialModalProps) => {
  const { t } = useTranslation();
  const isAboveTablet = useMediaQuery("tablet");

  return (
    <Modal id="extend-trial" isShowing={isShowing} hide={hide} padding="24px">
      <FlexContainer
        width={isAboveTablet ? "600px" : "100%"}
        flexDirection="column"
        gap={2.4}
        justifyContent="flex-start"
        alignItems="flex-start">
        <S.Title>{t("cancel.trial_title")}</S.Title>
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
            <S.DescText>{t("cancel.trial_desc")}</S.DescText>
            <FlexContainer flexDirection="column" width="100%">
              <Button
                style={{ fontWeight: 600 }}
                color="white"
                bgColor="green"
                width="100%"
                onClick={extend}
                radius="8px">
                <SVG icon={faCalendarCirclePlus} color="white" size="xl" />
                {t("cancel.extend_trial")}
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
