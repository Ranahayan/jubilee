import styled from "styled-components";
import { getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const CarouselContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const CarouselWrapper = styled.div`
  display: flex;
  width: ${getSize(32.3)};
  position: relative;

  ${responsive("tablet")} {
    width: ${getSize(48.4)};
  }
`;

export const CarouselContentWrapper = styled.div`
  display: flex;
  overflow: hidden;
  height: 100%;
  gap: ${getSize(1.8)};
  position: relative;
`;

export const CarouselContent = styled.ul`
  display: flex;
  margin: 0;
  padding: 0;
  transition: all 250ms linear;
  -ms-overflow-style: none;
  scrollbar-width: none;
  list-style: none;
  gap: ${getSize(1.5)};
  justify-content: flex-start;
  min-width: ${getSize(32.7)};

  &:first-child {
    margin-left: ${getSize(2.5)};
  }

  ::-webkit-scrollbar {
    display: none;
  }
`;

export const CarouselItem = styled.li`
  flex-shrink: 0;
`;

export const ImageSlide = styled.img`
  width: ${getSize(9.9)};
  height: ${getSize(9.9)};
  border-radius: ${getSize(1.2)};
  object-fit: cover;
  cursor: pointer;
`;

interface IStyledFlexContainer extends UIProps {
  disabled?: boolean;
}

export const Arrow = styled.div<IStyledFlexContainer>`
  position: absolute;
  top: ${getSize(3.4)};
  cursor: pointer;
  z-index: 1;
  ${({ disabled }) =>
    disabled &&
    `
      cursor: default;
      opacity: 0.5;
  `};
`;

export const Image = styled.img`
  height: 100%;
  width: 100%;
  border-radius: ${getSize(1.2)};
`;
