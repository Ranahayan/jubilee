import { faWandMagicSparkles } from "@fortawesome/pro-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { PageTitle } from "~/components/ui/PageTitle/styles";
import { SVGIcon } from "~/components/ui/SVG/types";
import { SVG } from "~/components/ui/SVG";
import Button from "~/components/ui/Button";

import * as S from "./styles";
import { paths } from "~/router/paths";
import { useNavigate } from "react-router-dom";
import { faDesktop, faMobile } from "@fortawesome/pro-light-svg-icons";
import { Dispatch, SetStateAction } from "react";
import { DeviceType } from "~/types/responsive";
import FlexContainer from "~/components/ui/FlexContainer";
import { triggerShowPlansModal } from "~/helpers/customEvents";
import { useAccount } from "~/hooks/useAccount";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

type Props = {
  screenPreview?: boolean;
  deviceType?: DeviceType;
  handleChange?: Dispatch<SetStateAction<DeviceType>>;
};

export const Preview = ({ screenPreview, deviceType, handleChange }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useAccount();

  const handleCustomize = () => {
    if (!DISABLE_PAYMENTS && (!account || !account.active_subscription)) {
      return triggerShowPlansModal();
    }

    navigate(paths.app.customization);
  };

  return (
    <S.PreviewContainer>
      <FlexContainer justifyContent="space-between">
        <PageTitle>{t("customization.preview")}</PageTitle>

        {screenPreview ? (
          <S.IconsContainer gap={3.0}>
            <SVG
              //@ts-ignore
              onClick={() => handleChange(DeviceType.DESKTOP)}
              icon={faDesktop as SVGIcon}
              size="xl"
              color={
                deviceType === DeviceType.DESKTOP ? "primary" : "textSecondary"
              }
            />
            <SVG
              //@ts-ignore
              onClick={() => handleChange(DeviceType.MOBILE)}
              icon={faMobile as SVGIcon}
              size="xl"
              color={
                deviceType === DeviceType.MOBILE ? "primary" : "textSecondary"
              }
            />
          </S.IconsContainer>
        ) : (
          <Button color="white" bgColor="primary" onClick={handleCustomize}>
            <SVG
              icon={faWandMagicSparkles as SVGIcon}
              color="white"
              size="lg"
            />
            {t("customization.customize")}
          </Button>
        )}
      </FlexContainer>
      {/* Widget Goes Here */}
    </S.PreviewContainer>
  );
};
