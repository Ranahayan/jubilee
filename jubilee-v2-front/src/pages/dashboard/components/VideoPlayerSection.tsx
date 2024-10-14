import { RefObject } from "react";
import { useTranslation } from "react-i18next";

import * as S from "../styles";
import { IVideoTutorial } from "~/types/video";
import PlayIcon from "~/assets/svg/play.svg?react";
import LogoWhite from "~/assets/svg/logo_white.svg?react";

type Props = {
  videoRef: RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  isOverlayVisible: boolean;
  selectedTutorial: IVideoTutorial;
  setIsPlaying: (value: boolean) => void;
};
const VideoPlayerSection = ({
  videoRef,
  isPlaying,
  setIsPlaying,
  selectedTutorial,
  isOverlayVisible,
}: Props) => {
  const { t } = useTranslation();

  return (
    <S.VideoBox>
      {!isPlaying ? (
        <S.Thumbnail>
          <LogoWhite />
          <h1>{t(selectedTutorial.title)}</h1>
        </S.Thumbnail>
      ) : (
        <S.VideoPlayer
          ref={videoRef}
          autoPlay
          playsInline
          controls
          key={selectedTutorial.videoUrl}>
          <source src={selectedTutorial.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </S.VideoPlayer>
      )}

      {isOverlayVisible && !isPlaying && (
        <S.Overlay>
          <S.PlayButton onClick={() => setIsPlaying(true)}>
            <PlayIcon />
          </S.PlayButton>
        </S.Overlay>
      )}
    </S.VideoBox>
  );
};

export default VideoPlayerSection;
