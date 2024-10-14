import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash";
import * as S from "./styles";
import { SVG } from "~/components/ui/SVG";
import { navItems } from "~/constants/sidebar";
import { useAccount } from "~/hooks/useAccount";
import Separator from "~/components/ui/Separator";
import { tutorials } from "~/constants/videoTutorial";
import ThumbnailPNG from "~/assets/png/thumbnail.png";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { faCircleExclamation } from "@fortawesome/pro-regular-svg-icons";
import VideoPlayerSection from "~/pages/dashboard/components/VideoPlayerSection";

const Dashboard = () => {
  const { t } = useTranslation();
  const isAboveTablet = useMediaQuery("laptop");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { account, showIntercom, isLoading, isInterCom } = useAccount();
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const selectedTutorial = tutorials[selectedIndex];

  const videoBoxRef = useRef<HTMLDivElement>(null);
  const tutorialListRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [tutorialListHeight, setTutorialListHeight] = useState<number | null>(null);
   useEffect(() => {
    const updateScroll = () => {
      const videoHeight = videoBoxRef.current?.offsetHeight ?? 0;
      setTutorialListHeight(videoHeight);
    };

    updateScroll();

    window.addEventListener('resize', updateScroll);
    return () => {
      window.removeEventListener('resize', updateScroll);
    };
  }, [tutorials, selectedIndex, isPlaying]); // Also re-run when tutorials or index changes

  const goPrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setIsOverlayVisible(true);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  const goNext = () => {
    if (selectedIndex < tutorials.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setIsOverlayVisible(true);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  const helpCenterPath = useMemo(
    () => navItems.find(({ showHelpCenterModal }) => showHelpCenterModal)?.path,
    [navItems]
  );

  return (
    <Fragment>
      <S.PageTitle>
        👋 {t("auth.welcome_label")}, {!isLoading && capitalize(account?.name)}
      </S.PageTitle>

      <S.Container>
        <S.Title>{t("dropshipping.your_quick_walkthrough")}</S.Title>
        <S.Content>
          <S.VideoBox ref={videoBoxRef}>
            <VideoPlayerSection
              videoRef={videoRef}
              isPlaying={isPlaying}
              isOverlayVisible={isOverlayVisible}
              selectedTutorial={selectedTutorial}
              setIsPlaying={(value) => setIsPlaying(value)}
            />
          </S.VideoBox>
          <Separator type="vertical" />
          {isAboveTablet ? (
            <S.TutorialListContent ref={tutorialListRef} style={tutorialListHeight ? {height: tutorialListHeight }: undefined}>
              <S.TutorialList>
                {tutorials.map((tutorial, index) => (
                  <Fragment key={index}>
                    <S.TutorialItem
                      active={index === selectedIndex}
                      onClick={() => {
                        setSelectedIndex(index);
                        setIsPlaying(false);
                      }}>
                      <S.TutorialText>
                        <img src={ThumbnailPNG} alt="Video icon" />
                        {t(tutorial.title)}
                      </S.TutorialText>
                      <S.TutorialDuration>{tutorial.duration}</S.TutorialDuration>
                    </S.TutorialItem>
                    {index < tutorials.length - 1 && (
                      <Separator type="horizontal" />
                    )}
                  </Fragment>
                ))}
              </S.TutorialList>
            </S.TutorialListContent>
          ) : (
            <S.MobileNav>
              <S.Arrow disabled={selectedIndex === 0} onClick={goPrev}>
                &larr; <span>{t("dropshipping.previous")}</span>
              </S.Arrow>
              <S.VideoTitle>{t(selectedTutorial.title)}</S.VideoTitle>
              <S.Arrow
                disabled={selectedIndex === tutorials.length - 1}
                onClick={goNext}>
                <span>{t("dropshipping.next")}</span>&rarr;
              </S.Arrow>
            </S.MobileNav>
          )}
        </S.Content>
      </S.Container>

      <S.Container>
        <S.MoreInfo>
          <SVG icon={faCircleExclamation} size="xs" />
          <S.InfoWrapper>
            {t("dropshipping.have_questions")}
            <S.Button onClick={() => window.open(navItems.find(({ showHelpCenterModal }) => showHelpCenterModal)?.path, "_blank")}>
              {t("nav.help_center")}
            </S.Button>
          </S.InfoWrapper>
        </S.MoreInfo>
      </S.Container>
    </Fragment>
  );
};

export default Dashboard;
