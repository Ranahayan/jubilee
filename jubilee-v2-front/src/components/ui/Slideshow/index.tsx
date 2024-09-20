import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Fade } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import FlexContainer from "../FlexContainer";
import { SVG } from "../SVG";
import * as S from "./styles";
import { faChevronLeft, faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "../SVG/types";

export interface ISlide {
  img: string;
  title?: string;
  description?: string;
  file?: string;
  url?: string;
}

type SlideshowContentProps = {
  slide: ISlide;
  children?: React.ReactNode;
  fitParent?: boolean;
  isFullHeight?: boolean;
  onClick?: () => void;
};

type SlideshowProps = {
  slides: ISlide[];
  children?: React.ReactNode;
  arrows?: boolean;
  indicators?: boolean;
  fitParent?: boolean;
  isFullHeight?: boolean;
  autoplay?: boolean;
  onClick?: () => void;
};

const SlideshowContent = ({ slide, onClick, children, fitParent = false, isFullHeight = true }: SlideshowContentProps) => {
  const { t } = useTranslation();
  return (
    //@ts-ignore
    <FlexContainer onClick={onClick} width="100%" flexDirection="column" justifyContent="center">
      {fitParent ? <S.ImageFit isFullHeight={isFullHeight} src={slide.img || slide.file || slide.url} /> : <S.Image src={slide.img || slide.file || slide.url} />}
      {slide.title && (
        <S.Title>{t(slide.title)}</S.Title>
      )}
      {slide.description && (
        <S.Description>{t(slide.description)}</S.Description>
      )}
      {children ? <S.ChildrenWrapper>{children}</S.ChildrenWrapper> : null}
    </FlexContainer>
  );
};

const Slideshow = ({
  slides = [],
  children,
  arrows = true,
  indicators,
  fitParent = false,
  isFullHeight = true,
  autoplay = true,
  onClick
}: SlideshowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!slides.length) return null;
  if (slides.length === 1)
    return <SlideshowContent onClick={onClick} slide={slides[0]}>{children}</SlideshowContent>;

  return (
    <S.SlideContainer>
      {indicators && (
        <S.SlideDots>
          {slides.map((s, index) => <S.SlideDot isActive={currentSlide === index} key={index} />)}
        </S.SlideDots>
      )}
      <Fade
        autoplay={autoplay}
        arrows={arrows}
        onStartChange={(value: number) => {
          // Shift the current index by 1 to fix the dots animation.
          setCurrentSlide((value + 1) % (slides.length));
        }}
        indicators={false}
        prevArrow={
          <S.ArrowContainer>
            <SVG icon={faChevronLeft as SVGIcon} />
          </S.ArrowContainer>
        }
        nextArrow={
          <S.ArrowContainer>
            <SVG icon={faChevronRight as SVGIcon} />
          </S.ArrowContainer>
        }
      >
        {slides.map((slide, index) => (
          <SlideshowContent onClick={onClick} isFullHeight={isFullHeight} key={index} slide={slide} fitParent={fitParent}>
            {children}
          </SlideshowContent>
        ))}
      </Fade>
    </S.SlideContainer>
  );
};

export default Slideshow;
