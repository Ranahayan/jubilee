import { useTranslation } from "react-i18next";
import * as S from "~/components/helpCenterModal/styles";
import Modal from "~/components/ui/Modal";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { VideoWrapper } from "~/components/video-wrapper";
import { videos } from "~/constants/videos";

type Props = {
  isShowing: boolean;
  hide: () => void;
  path: string;
};

export const HelpCenterModal = ({ isShowing, path, hide }: Props) => {
  const { t } = useTranslation();
  const isLaptop = useMediaQuery("desktop");

  return (
    <Modal
      id="help-center"
      isShowing={isShowing}
      hide={() => hide()}
      minWidth={isLaptop ? "50%" : "80%"}>
      <S.Container>
        <VideoWrapper videos={videos} />
        <S.MoreHelpText>
          {t("settings.need_more_help")}
          <S.MoreHelpLink href={path} target="_blank" rel="noopener noreferrer">
            {t("settings.help_center")}
          </S.MoreHelpLink>
        </S.MoreHelpText>
      </S.Container>
    </Modal>
  );
};
