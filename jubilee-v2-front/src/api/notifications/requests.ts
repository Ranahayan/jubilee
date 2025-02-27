import { sendGet, sendPost } from "../base";
import { getAPIData } from "../helpers";

export const getNotifications = () => getAPIData(sendGet("notifications/all/"));

export const postMarkAllRead = () => getAPIData(sendPost(`notifications/mark-all-read/`));

export const postMarkRead = (notificationId: number) => getAPIData(sendPost(`notifications/mark-read/${notificationId}/`));

