import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const SlideContainer = styled.div`
  position: relative;
  height: 100%;

  & > div {
    height: 100%;
  }

  .react-slideshow-fadezoom-images-wrap {
    height: 100%;
  }
`;


export const ArrowContainer = styled.div`
  background: ${getColor("border")};
  border-radius: 50%;
  height: ${getSize(3.2)};
  width: ${getSize(3.2)};
  color: ${getColor("text")};
  margin: 0 ${getSize(1.0)};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const Title = styled.h3`
  font-weight: 500;
  font-size: 20px;
  line-height: 180%;
  letter-spacing: 0.6px;
  color: ${getColor("text")};
  max-width: ${getSize(45)};
  text-align: center;
  margin: 0;
`;

export const Description = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 180%;
  letter-spacing: 0.6px;
  max-width: ${getSize(60)};
  text-align: center;
  color: ${getColor("textSecondary")};
  margin: 0;
`;

export const Image = styled.img`
  width: 100%;
  max-width: ${getSize(70)};
  object-fit: contain;
  padding: ${getSize(5)};
  padding-bottom: ${getSize(2)};
  margin: 0;
`;

interface ImageFitProps {
  isFullHeight: boolean;
}

export const ImageFit = styled.img<ImageFitProps>`
  height: ${({ isFullHeight }) => (isFullHeight ? "100vh" : "100%")};
  width: 100%;
  object-fit: cover;
`;

export const ChildrenWrapper = styled.div`
  margin-top: ${getSize(2)};
`;

export const SlideDots = styled.div`
  display: flex;
  position: absolute;
  transform: translateX(-50%);
  left: 50%;
  bottom: 15%;
  z-index: 2;
  gap: 8px;

  ${responsive("desktop")} {
    bottom: 10%;
  }
`;

export const SlideDot = styled.div<{ isActive: boolean }>`
  display: block;
  width: ${({ isActive }) => (isActive ? "18px" : "10px")};
  height: 10px;
  background-color: #fff;
  border-radius: ${({ isActive }) => (isActive ? "6px" : "50%")};
  opacity: ${({ isActive }) => (isActive ? "1" : "0.3")};
  transition: all 0.3s ease-out;
`;
