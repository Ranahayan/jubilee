import { useTranslation } from "react-i18next";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import Label from "~/components/ui/Label";
import Modal from "~/components/ui/Modal";

import * as S from "./styles";

type Props = {
  isShowing: boolean;
  hide: () => void;
};

export const PauseExceededWarningModal = ({ isShowing, hide }: Props) => {
  const { t } = useTranslation();

  return (
    <Modal id="pause-exceeded" isShowing={isShowing} hide={hide} padding="32px" minWidth="260px">
      <FlexContainer flexDirection="column" gap={2.2} width="260px">
        <Label text={t("settings.pause_exceeded_title")} alignItems="center">
          <S.CenteredText secondary>
            {t("settings.pause_exceeded")}
          </S.CenteredText>
        </Label>

        <Button
          onClick={hide}
          children={t("settings.ok")}
          color="white"
          bgColor="primary"
          alignSelf="center"
          padding="10px 32px"
        />
      </FlexContainer>
    </Modal>
  );
};
