import { useState } from 'react';
import { SVG } from '../SVG';
import { faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { SVGIcon } from '../SVG/types';
import * as S from "./styles";
import FlexContainer from '../FlexContainer';

interface Props {
  slides: { img: string }[];
}

const Carousel = ({ slides }: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [image, setImage] = useState(slides[0]?.img);

  const slideGroups = [];
  for (let i = 0; i < slides.length; i += 3) {
    slideGroups.push(slides.slice(i, i + 3));
  }

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === slideGroups.length - 1 ? 0 : prevSlide + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? slideGroups.length - 1 : prevSlide - 1));
  };

  return (
    <FlexContainer flexDirection="column" gap={3.0} width="100%">
      <S.Image src={image} />
      <S.CarouselContainer>
        <S.CarouselWrapper>
          <S.Arrow
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{ left: 0 }}
          >
            <SVG
              icon={faChevronLeft as SVGIcon}
            />
          </S.Arrow>
          <S.CarouselContentWrapper>
            {slideGroups.map((slideGroup, index) => (
              <S.CarouselContent
                key={index}
                style={{ transform: `translateX(-${(currentSlide * 100)}%)` }}
              >
                {slideGroup.map((slide, index) => (
                  <S.CarouselItem key={index}>
                    <S.ImageSlide src={slide?.img} onClick={() => setImage(slide?.img)}/>
                  </S.CarouselItem>
                ))}
              </S.CarouselContent>
            ))}
          </S.CarouselContentWrapper>
          <S.Arrow
            onClick={nextSlide}
            disabled={currentSlide === slideGroups.length - 1}
            style={{ right: 0 }}
          >
            <SVG
              icon={faChevronRight as SVGIcon}
            />
          </S.Arrow>
        </S.CarouselWrapper>
      </S.CarouselContainer>
    </FlexContainer>
  );
};

export default Carousel;
