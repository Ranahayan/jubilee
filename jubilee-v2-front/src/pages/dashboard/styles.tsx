import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const PageTitle = styled.h3`
  font-weight: 600;
  font-size: 20px;
  line-height: 21px;
`;

export const Container = styled.div`
  padding: 24px;
  background-color: ${getColor("white")};
  border-radius: ${getSize(0.6)};
  margin: 20px 0;

  ${responsive("mobileL", true)} {
    padding: 10px;
  }
`;

export const MoreInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const InfoWrapper = styled.div`
  font-weight: 400;
  font-size: 16px;
  vertical-align: middle;
  color: ${getColor("#131313")};
`

export const Button = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0 5px;
  color: ${getColor("primary")};
  cursor: pointer;
  font: inherit;
  text-decoration: underline;

  &:disabled {
    color: ${getColor("disabled")};
    cursor: not-allowed;
  }
`;

export const Title = styled.h2`
  font-weight: 600;
  font-size: 16px;
  line-height: 100%;
  margin-bottom: 20px;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;

  ${responsive("laptop")} {
    flex-direction: row;
    gap: 24px;
  }
`;

export const VideoBox = styled.div`
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 280px;

  video,
  img {
    width: 100%;
    max-height: 280px;
    display: block;
    object-fit: contain;
  }
`;

export const Thumbnail = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 8px;
  background: ${getColor("primary")};
  color: ${getColor("white")};
  height: 100%;
  padding: 0 20px;
  min-height: 280px;
  
  h1{
    font-weight: 600;
    font-size: 37px;
    line-height: 42px;
    text-align: center;
    text-transform: capitalize;
  }

  ${responsive("desktop", true)} {
    padding: 0 5px;

    h1{
      font-size: 28px;
      line-height: 32px;
    }
  }
`;

export const VideoPlayer = styled.video`
  height: 100%;
  min-height: 280px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

export const PlayButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  width: 75px;
  height: 44px;
  border-radius: 6px;
  
  svg {
    width: 30px;
    height: 30px;
    fill: ${getColor("primary")};
  }
`;
export const TutorialListContent = styled.div`
  flex: 1 1 0px;
  position: relative;
  max-height: 100%;
    overflow: auto;
  display: flex;
  flex-direction: column;
`;

export const TutorialList = styled.div`
  flex: 1;
  margin-top: 24px;
  overflow-y: auto;

  ${responsive("laptop")} {
    margin-top: 0;
  }
`;

export const TutorialItem = styled.div<{ active?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 5px;
  cursor: pointer;
  font-size: 15px;
  line-height: 100%;
  color: ${({ active }) => getColor(active ? "primary" : "##2E2E2E")};
  font-weight: ${({ active }) => (active ? "500" : "400")};

  &:hover {
    background-color: #f9fafb;
  }
`;

export const TutorialText = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 400;
  font-size: 15px;
  line-height: 120%;
  
  img {
    width: 38px;
    height: 30px;
    border-radius: 6px;
  }
`;

export const TutorialDuration = styled.span`
  font-size: 14px;
`;

export const MobileNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  width: 100%;
`;

export const Arrow = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  font-size: 24px;
  vertical-align: center;
  color: ${({ disabled }) => getColor(disabled ? "#ccc" : "#282735")};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};

  span {
    font-size: 14px;
    font-weight: 500;
  }

  ${responsive("mobileL", true)} {
    gap: 1px;
    font-size: 14px;

    span {
      font-size: 12px;
    }
  }
`;

export const VideoTitle = styled.div`
  flex: 1;
  text-align: center;
  font-weight: 500;
  font-size: 16px;
  padding: 0 10px;
  line-height: 20px;
  color: ${getColor("primary")};

  ${responsive("mobileL", true)} {
    font-size: 14px;
    color: ${getColor("primary")};
  }
`;

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-height: 300px;
  background: rgba(25, 25, 25, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;
