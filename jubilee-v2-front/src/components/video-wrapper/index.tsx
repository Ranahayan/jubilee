import { useState } from "react";
import * as S from "./VideoWrapper.style";
import { SVG } from "~/components/ui/SVG";
import { faPlay } from "@fortawesome/pro-solid-svg-icons";
import { IconDefinition } from "@fortawesome/pro-light-svg-icons";
import { IVideo } from "~/types/video";
import { useTranslation } from "react-i18next";

type TypeVideoWrapper = {
  videos: IVideo[];
};

export const VideoWrapper = ({ videos }: TypeVideoWrapper) => {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const { t } = useTranslation();

  return (
    <S.VideoContainer>
      <S.Header>{t("home.video_component_title")}</S.Header>

      <S.VideoContent>
        <S.Video>
          <S.Iframe
            title={t(selectedVideo.titleKey) as string}
            src={selectedVideo.url}
          />
        </S.Video>
        <S.Titles>
          {videos.map((video: IVideo, i: number) => (
            <S.TitleContainer
              key={`${video}-${i}`}
              onClick={() => setSelectedVideo(video)}
              selected={selectedVideo === video}>
              <SVG icon={faPlay as IconDefinition} />
              <S.Title>{t(video.titleKey)}</S.Title>

              {video.time}
            </S.TitleContainer>
          ))}
        </S.Titles>
      </S.VideoContent>
    </S.VideoContainer>
  );
};
