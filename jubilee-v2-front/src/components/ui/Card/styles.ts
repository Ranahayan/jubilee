import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import Text from "../Text";
import FlexContainer from "../FlexContainer";
import { UIProps } from "~/types/style";

interface IPublishedText extends UIProps {
  isPublished: boolean;
}

export const CardContainer = styled.div`
  position: relative;
  border: 1px solid ${getColor("border")};
  border-radius: ${getSize(0.4)};
  display: flex;
  flex-direction: column;
  align-items: baseline;
  justify-content: center;
  gap: ${getSize(1.0)};
  cursor: pointer;
  width: ${getSize(27.4)};
  height: ${getSize(32.4)};
`;

export const StyledText = styled(Text)`
  margin: 0 auto;
`;

export const IconContainer = styled.div`
  border-radius: 50%;
  margin: 0 auto;
  padding: ${getSize(2.0)};
  background-color: ${getColor("borderSecondary")};
`;

export const FooterCard = styled(FlexContainer)`
  width: 100%;
  justify-content: space-between;
  padding: ${getSize(1.0)} ${getSize(1.6)};
`;

export const PublishedText = styled.span<IPublishedText>`
  font-size: ${getSize(0.9)};
  color: ${({ isPublished }) =>
    isPublished ? getColor("primary") : getColor("textSecondary")};
`;

export const DateText = styled.span`
  font-size: ${getSize(0.9)};
  color: ${getColor("textSecondary")};
`;

export const ImgContent = styled.img`
  max-height: ${getSize(24.5)};
  object-fit: cover;
  width: -webkit-fill-available;
`;

export const DeleteIconContainer = styled.div`
  position: absolute;
  padding: 7px 12px;
  background-color: ${getColor("red")};
  border-radius: 6px;
  top: 5px;
  right: 8px;

  &:hover {
    opacity: 0.9;
  }
`;
