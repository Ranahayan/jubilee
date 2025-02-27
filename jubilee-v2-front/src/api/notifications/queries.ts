import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
	NOTIFICATIONS
} from "./types";
import {
	getNotifications,
  postMarkAllRead,
  postMarkRead
} from "./requests";
import { INotification } from "~/types/notifications";
import { ISidebarCount } from "../sidebarCounts/types";

export const useGetNotifications = () =>
	useQuery<INotification[]>(NOTIFICATIONS, () => getNotifications());

export const useMarkAllNotificationsRead = () => useMutation(postMarkAllRead);

export const useMarkNotificationRead = () => useMutation(postMarkRead);

export const useGetUnreadNotifications = () =>
	useInfiniteQuery<ISidebarCount>(NOTIFICATIONS, async () => {
		let notifications = await getNotifications();
		notifications = notifications.filter((notification: INotification) => !notification.is_read);
		return { count: notifications.length };
	});