import styled, { keyframes } from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import Text from "../../../../components/ui/Text";
import FlexContainer from "~/components/ui/FlexContainer";
import { UIProps } from "~/types/style";

interface ImageContainerProps extends UIProps {
  backgroundColor?: string;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
    height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    height: 30px;
  }
`;

export const ProductCardContainer = styled.div`
  border-radius: ${getSize(0.6)};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  height: auto;

  ${responsive("laptopL")} {
    height: ${getSize(44.0)};

    .styled-flex-container {
      min-height: ${getSize(14.0)};
      position: absolute;
      width: 100%;
      bottom: 0;
    }  
  }

  &:hover {
    .hovered-container {
      display: flex;
      animation: ${fadeInUp} 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .styled-flex-container {
      transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
    }
  }
`;

export const PremiumBadge = styled.div`
  padding: ${getSize(0.1)} ${getSize(0.8)};
  top: -34px;
  left: 8px;
  gap: ${getSize(0.6)};
  border-radius: ${getSize(2.0)};
  background-color: ${getColor("white")};
  z-index: 2;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover::before {
    animation: ${fadeIn} 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    content: 'Sell exclusive products with high margin and fast shipping';
    position: absolute;
    font-size: ${getSize(1.2)};
    background-color: ${getColor("white")};
    padding: ${getSize(0.4)};
    border-radius: ${getSize(0.4)};
    line-height: 1.5;
    color: ${getColor("secondary")};
    box-shadow: 0px 4px 4px 0px ${getColor("border")};
    width: ${getSize(20.0)};
    top: ${getSize(3.6)};
    left: 0;
  }
`;

export const PremiumBadgeText = styled(Text)`
  font-size: ${getSize(1.1)};
  color: ${getColor("primary")};
  font-weight: 500;
  margin-top: ${getSize(0.2)};
`;

export const StyledText = styled(Text)`
  font-weight: 500;
`;

export const Tags = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${getSize(0.8)};
  flex-wrap: wrap;
`;

export const StyledTag = styled.div`
  padding: 0 ${getSize(0.6)};
  line-height: ${getSize(1.8)};
  border-radius: ${getSize(0.4)};
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  font-size: ${getSize(1.2)};
  font-weight: 500;
`;

export const StyledTitle = styled(Text)`
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  width: ${getSize(17.7)};
`;

export const ImageContainer = styled.div<ImageContainerProps>`
  height: 100%;
  background-color: ${({ backgroundColor }) => backgroundColor ? backgroundColor : getColor("borderSecondary")};
  height: ${getSize(30.0)};
  overflow: hidden;
  position: relative;

  ${responsive("tablet")} {
    .react-slideshow-container, .react-slideshow-fadezoom-wrapper, .react-slideshow-fadezoom-images-wrap, img  {
      height: 100% !important;
    }
  }
`;

export const StyledFlexContainer = styled.div`
  display: flex;
  z-index: 10;
  position: relative;
  flex-direction: column;
  align-items: baseline;
  justify-content: baseline;
  padding: ${getSize(1.8)};
  background-color: ${getColor("white")};
  border-radius: 0 0 ${getSize(0.6)} ${getSize(0.6)};
  gap: ${getSize(1.0)};
`;

export const StyledIcon = styled.div`
  border-radius: 6px;
  min-width: ${getSize(4.0)};
  min-height: ${getSize(4.0)};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${getColor("borderSecondary")};

  &:hover {
    background-color: ${getColor("border")};
  }
`;

export const HoveredContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;

  ${responsive("laptopL")} {
    display: none;
  }
`;

export const FlexContainerRelative = styled(FlexContainer)`
  position: relative;
`;

export const SupplierText = styled(Text)`
  font-size: ${getSize(1.0)};
  color: ${getColor("secondary")};
  margin-right: ${getSize(0.8)};
  font-weight: 500;
`;

export const ViewProductButton = styled.button`
  outline: none;
  border: none;
  background-color: transparent;
  color: ${getColor("primary")};
  text-decoration: underline;
  cursor: pointer;
  font-size: ${getSize(1.0)};
  position: relative;

  &:hover {
    opacity: 0.8;
  }

  &:before {
    position: absolute;
    content: "";
    display: block;
    width: 1px;
    height: 10px;
    left: -7px;
    top: 3px;
    background: ${getColor("border")};
    transition: width 0.3s;
  }
`;

export const CheckboxContainer = styled.div`
  position: absolute;
  top: ${getSize(0.6)};
  left: ${getSize(0.6)};
  z-index: 2;
`;
