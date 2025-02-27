import styled, { css, keyframes } from "styled-components";
import {
  getColor,
  getFadeInAnimation,
  getSize,
  responsive,
} from "~/helpers/style";

import { UIProps } from "~/types/style";

interface INotificationButton extends UIProps {
  unread: number;
}

interface INotificationItem extends UIProps {
  themeColor: {
    icon: string;
    bg: string;
  };
}

interface INotificationItemAction {
  color: string;
}

const fadeInFromRight = keyframes`
  from {
    right: -350px;
  }
  to {
    right: 0;
  }
`;

const getUnreadCount = (unread: number) => {
  if (unread === 0) return "";

  return css`
    &::after {
      content: "${unread}";
      display: inline-block;
      width: ${getSize(2.0)};
      height: ${getSize(2.0)};
      border-radius: 50%;
      background-color: ${getColor("red")};
      color: ${getColor("white")};
      font-size: ${getSize(1.2)};
      font-weight: 700;
      text-align: center;
      line-height: ${getSize(2.0)};
      position: absolute;
      top: -${getSize(0.5)};
      right: -${getSize(1.0)};
    }
  `;
};

export const NotificationButton = styled.div<INotificationButton>`
  cursor: pointer;
  position: absolute;
  left: ${getSize(2.0)};
  top: ${getSize(2.0)};

  svg {
    color: ${getColor("border")};
  }

  ${({ unread }) => getUnreadCount(unread)}

  ${responsive("tablet")} {
    left: initial;
    top: initial;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
`;

export const Drawer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  background-color: ${getColor("white")};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  animation: ${getFadeInAnimation()} 0.3s;
  z-index: 11;
  cursor: default;
  animation: ${fadeInFromRight} 0.3s cubic-bezier(0.33, 1, 0.68, 1);

  ${responsive("tablet")} {
    width: 350px;
  }
`;

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${getSize(2.0)};
  border-bottom: 1px solid ${getColor("borderSecondary")};
`;

export const DrawerTitle = styled.div`
  font-size: ${getSize(1.6)};
  font-weight: 500;
`;

export const DrawerCloseButton = styled.div`
  margin-left: auto;
  cursor: pointer;
`;

export const DrawerContent = styled.div`
  padding: ${getSize(2.0)};
  overflow-y: auto;
  height: calc(100% - 50px);
`;

export const NotificationItem = styled.div<INotificationItem>`
  display: flex;
  margin-bottom: ${getSize(0.8)};
  background-color: ${({ themeColor }) => getColor(themeColor.bg)};
  padding: ${getSize(1.6)};
  border-radius: 6px;
  line-height: 1.25;

  svg {
    color: ${({ themeColor }) => getColor(themeColor.icon)};
  }
`;

export const NotificationItemIcon = styled.div`
  margin-right: ${getSize(2.0)};
`;

export const NotificationItemText = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${getSize(1.4)};
  flex: 1;
  gap: ${getSize(0.4)};

  span {
    color: ${getColor("textSecondary")};
    font-size: ${getSize(1.2)};
  }
`;

export const NotificationItemTime = styled.div`
  color: ${getColor("textSecondary")};
  font-size: ${getSize(1.2)};
`;

export const NotificationItemAction = styled.div<INotificationItemAction>`
  color: ${({ color }) => getColor(color)};
  font-size: 12px;
  cursor: pointer;
  align-self: flex-end;
`;

export const NotificationItemFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${getSize(0.8)};
`;

export const EmptyState = styled.p`
  color: ${getColor("textSecondary")};
  text-align: center;
  margin-top: ${getSize(2.0)};
`;
