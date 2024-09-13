import { NavLink } from "react-router-dom";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";
import styled, { keyframes } from "styled-components";

export const sidebarWidth = 240;
export const sidebarMobileHeight = 64;

interface MenuItensContainerProps extends UIProps {
  gap?: number;
}

export const MenuItemTitle = styled.h2`
  line-height: ${getSize(1.58)};
  font-size: ${getSize(1)};
  font-weight: 500;
  color: ${getColor("sidebarSectionTitle")};
  text-transform: uppercase;
  padding-left: ${getSize(1.8)};
  letter-spacing: 1.5px;

  &:not(:first-child) {
    padding-top: ${getSize(1.8)};
  }
`;

export const SidebarContainer = styled.div`
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${getSize(1)} 0;
  width: 100vw;
  min-height: ${sidebarMobileHeight}px;
  background-color: ${getColor("backgroundSecondary")};
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  border-right: 1px solid ${getColor("sidebarBorder")};

  ${responsive("tablet")} {
    padding: ${getSize(2)} 0;
    width: ${sidebarWidth}px;
    height: 100vh;
    justify-content: flex-start;
  }
`;

export const NavContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vw;
  margin-top: ${getSize(5.8)};
  padding: 0;
  height: 100%;

  ${responsive("tablet")} {
    padding: ${getSize(0.6)} ${getSize(1.2)} 0 0;
    width: 100%;
  }
`;

export const MenuItensContainer = styled.div<MenuItensContainerProps>`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: ${({ gap }) => (gap ? getSize(gap) : 0)};
`;

export const NavItem = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  color: ${getColor("text")};
  margin-bottom: ${getSize(0.5)};

  > button {
    width: 100%;
    text-align: center;
    font-size: 15px;

    svg {
      font-size: 20px;
    }

    ${responsive("tablet")} {
      text-align: left;
    }
  }
`;

export const MobileMenu = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const LinkContainer = styled.div`
  display: flex;
  height: calc(${sidebarMobileHeight}px - ${getSize(2)});

  ${responsive("tablet")} {
    width: 100%;
  }
`;

export const BrandContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: ${getSize(1)} ${getSize(2)};

  & > svg {
    margin-right: ${getSize(1)};
  }
`;

export const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(${sidebarMobileHeight}px - ${getSize(1)});
  width: calc(${sidebarMobileHeight}px - ${getSize(1)});
  position: absolute;
  right: ${getSize(1)};
  top: ${getSize(0.5)};
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  outline: none;
`;

export const SidebarFooter = styled.div`
  bottom: 0;
  left: 0;
  width: 100%;

  ${responsive("tablet")} {
    position: absolute;
    padding: ${getSize(1)} ${getSize(2)};
  }

  > button {
    width: 100%;
    font-weight: 600;
    font-size: ${getSize(1.25)};

    svg {
      margin-right: ${getSize(0.5)};
    }
  }
`;

export const SidebarMenuSeparator = styled.div`
  width: calc(100% - ${getSize(3)});
  height: 1px;
  background-color: ${getColor("borderSecondary")};
  margin: ${getSize(1.5)} ${getSize(1.5)};
`;

const popIn = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const Count = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: ${getSize(2.5)};
  padding: 0 ${getSize(0.6)};
  height: ${getSize(2.0)};
  background-color: ${getColor("primaryLight")};
  color: ${getColor("primary")};
  border-radius: ${getSize(2.0)};
  font-size: ${getSize(1.2)};
  font-weight: 600;
  animation: ${popIn} 0.3s cubic-bezier(0.68, -0.6, 0.32, 1.6);
  border: 1px solid ${getColor("white")};
`;

export const NewContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 17px;
  border-radius: 40px;
  background-color: #6056eb1a;
  padding: 0 8px;
  height: 20px;
  transform: translateX(-22px);
`;

export const NewText = styled.p`
  font-style: normal;

  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.0015em;
  color: #6056eb;
  text-decoration: none;
`;
