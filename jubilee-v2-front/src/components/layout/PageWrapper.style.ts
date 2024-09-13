import styled from "styled-components";
import {
  getColor,
  getFadeInAnimation,
  getSize,
  responsive,
} from "~/helpers/style";
import { sidebarMobileHeight, sidebarWidth } from "./Sidebar.style";
import { UIProps } from "~/types/style";

interface IPageWrapper extends UIProps {
  padding: string;
}

export const PageWrapper = styled.div<IPageWrapper>`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${sidebarMobileHeight}px);
  max-height: calc(100vh - ${sidebarMobileHeight}px);
  overflow-y: auto;
  width: 100vw;
  left: 0;
  top: ${sidebarMobileHeight}px;
  position: fixed;
  padding: ${getSize(1.25)};
  background-color: ${getColor("background")};
  ${getFadeInAnimation(0.5)}

  ${responsive("tablet")} {
    min-height: 100vh;
    max-height: 100vh;
    padding: ${({ padding }) => padding};
    width: calc(100vw - ${sidebarWidth}px);
    top: 0;
    left: ${sidebarWidth}px;
  }
`;

export const PageWrapperFullscreen = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  width: 100vw;
  background-color: ${getColor("background")};
  ${getFadeInAnimation(0.5)}
`;

export const PageMaxWidth = styled.div`
  width: 100%;
  margin: 0 auto;
`;

export const PageHeader = styled.div`
  display: flex;
  direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-left: auto;
`;
