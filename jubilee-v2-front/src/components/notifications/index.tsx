import { SVG } from "~/components/ui/SVG";
import {
  faTimes,
  faCheckCircle,
  faCircleInfo,
  faCircleExclamation,
  faTriangleExclamation,
} from "@fortawesome/pro-solid-svg-icons";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import * as S from "./styles";
import { useEffect, useState, forwardRef, useRef } from "react";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
} from "~/api/notifications/queries";
import { INotification, NotificationType } from "~/types/notifications";
import useClickOutside from "~/hooks/useClickOutside";
import { useTranslation } from "react-i18next";
import { useTimeSince } from "~/hooks/useTimeSince";
import { SHOW_NOTIFICATIONS } from "~/helpers/customEvents";

interface NotificationItemProps {
  title: string;
  description?: string;
  type: NotificationType;
  primaryActionText?: string;
  primaryActionUrl?: string;
  secondaryActionText?: string;
  secondaryActionUrl?: string;
  createdAt: Date;
}

interface DrawerProps {
  onClose: () => void;
  notifications: INotification[];
}

const getNotificationIcon = (status: string) => {
  switch (status) {
    case "success":
      return faCheckCircle;
    case "info":
      return faCircleInfo;
    case "error":
      return faCircleExclamation;
    case "warning":
      return faTriangleExclamation;
    default:
      return faCircleInfo;
  }
};

const NotificationItem = ({
  title,
  description,
  type,
  primaryActionText,
  primaryActionUrl,
  secondaryActionText,
  secondaryActionUrl,
  createdAt,
}: NotificationItemProps) => {
  const timeSince = useTimeSince(createdAt);

  const getThemeColorByStatus = (type: NotificationItemProps["type"]) => {
    switch (type) {
      case "success":
        return { icon: "green", bg: "greenSecondary" };
      case "error":
        return { icon: "red", bg: "redSecondary" };
      case "warning":
        return { icon: "yellow", bg: "yellowSecondary" };
      case "info":
      default:
        return { icon: "primary", bg: "background" };
    }
  };

  const handleAction = (url: string) => {
    window.open(url, "_blank");
  };

  const themeColor = getThemeColorByStatus(type);

  return (
    <S.NotificationItem themeColor={themeColor}>
      <S.NotificationItemIcon>
        <SVG icon={getNotificationIcon(type as string) as Icon} size="lg" />
      </S.NotificationItemIcon>
      <S.NotificationItemText>
        {title}
        <span>{description}</span>

        <S.NotificationItemFooter>
          <S.NotificationItemTime>{timeSince}</S.NotificationItemTime>
          {primaryActionText && primaryActionUrl ? (
            <S.NotificationItemAction
              onClick={() => handleAction(primaryActionUrl)}
              color={themeColor.icon}>
              {primaryActionText}
            </S.NotificationItemAction>
          ) : null}
          {secondaryActionText && secondaryActionUrl ? (
            <S.NotificationItemAction
              onClick={() => handleAction(secondaryActionUrl)}
              color={themeColor.icon}>
              {secondaryActionText}
            </S.NotificationItemAction>
          ) : null}
        </S.NotificationItemFooter>
      </S.NotificationItemText>
    </S.NotificationItem>
  );
};

const Drawer = forwardRef(({ onClose, notifications }: DrawerProps, ref) => {
  const { t } = useTranslation();

  return (
    <S.Drawer ref={ref as any}>
      <S.DrawerHeader>
        <S.DrawerTitle>{t("notifications.title")}</S.DrawerTitle>
        <S.DrawerCloseButton onClick={onClose}>
          <SVG icon={faTimes as Icon} size="lg" />
        </S.DrawerCloseButton>
      </S.DrawerHeader>
      <S.DrawerContent>
        {notifications.length === 0 ? (
          <S.EmptyState>{t("notifications.empty_state")}</S.EmptyState>
        ) : null}

        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            title={notification.title}
            description={notification.message}
            primaryActionText={notification.primary_action_text}
            primaryActionUrl={notification.primary_action_url}
            secondaryActionText={notification.secondary_action_text}
            secondaryActionUrl={notification.secondary_action_url}
            createdAt={notification.created_at}
          />
        ))}
      </S.DrawerContent>
    </S.Drawer>
  );
});

export const Notifications = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const { data: notifications } = useGetNotifications();
  const { mutateAsync: markAllNotificationsRead } =
    useMarkAllNotificationsRead();
  const ref = useRef(null);

  useClickOutside(ref, () => {
    setShowDrawer(false);
  });

  const toggleDrawer = () => {
    markAllNotificationsRead();
    setShowDrawer(!showDrawer);
  };

  useEffect(() => {
    const handleShowNotifications = () => {
      markAllNotificationsRead();
      setShowDrawer(!showDrawer);
    };

    // @ts-ignore
    window.addEventListener(SHOW_NOTIFICATIONS, handleShowNotifications);
    return () => {
      // @ts-ignore
      window.removeEventListener(SHOW_NOTIFICATIONS, handleShowNotifications);
    };
  }, [showDrawer]);

  return (
    <>
      {showDrawer ? (
        <Drawer
          ref={ref}
          notifications={notifications || []}
          onClose={toggleDrawer}
        />
      ) : null}
    </>
  );
};
