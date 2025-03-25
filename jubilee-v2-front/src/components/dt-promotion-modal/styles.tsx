/* modal.styles.ts */
import styled from "styled-components";

export const ModalContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export const ContentGrid = styled.div<{ isMobile: boolean }>`
  display: grid;
  grid-template-columns: ${({ isMobile }) => isMobile ? "1fr" : "1fr 1fr"};
  gap: ${({ isMobile }) => isMobile ? "0" : "48px"};
  padding: ${({ isMobile }) => isMobile ? "16px" : "0px"};
`;

export const ImageWrapper = styled.div<{ isMobile: boolean }>`
  position: relative;
  overflow: hidden;
  ${({ isMobile }) => isMobile && `
    width: 100%;
    height: 120px;
    border-radius: 20px;
    margin: 0 auto;
  `}
`;

export const Image = styled.img<{ isMobile: boolean }>`
  width: 100%;
  border-radius: 4px;
  ${({ isMobile }) => !isMobile && `
    height: 100%;
    object-fit: cover;
  `}
`;

export const TextContent = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: ${({ isMobile }) => isMobile ? "16px" : "60px 16px 16px 0px"};
`;

export const Heading = styled.h2`
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
`;

export const BlueText = styled.span`
  color: #2233ea;
`;

export const Subheading = styled.h4`
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  line-height: 2;
`;

export const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  span {
    font-size: 15px;
    color: #202223;
  }
`;

export const CtaButton = styled.button<{ isMobile: boolean }>`
  padding: 14px 24px;
  width: 100%;
  max-width: 260px;
  border-radius: 20px;
  color: white;
  background-color: #2233ea;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1c2bc4;
  }

  max-width: ${({ isMobile }) => isMobile ? "100%;" : ""};
`;

export const ContinueButton = styled.div<{ isMobile: boolean }>`
  position: ${({ isMobile }) => isMobile ? "relative" : "absolute"};
  margin-top: ${({ isMobile }) => isMobile ? "15px" : "0px"};
  right: 16px;
  bottom: 16px;
  font-size: 16px;
  display: flex;
  gap: 8px;
  justify-content: ${({ isMobile }) => isMobile ? "center" : "end"};
  color: #8F949C;
  cursor: pointer;
`;
