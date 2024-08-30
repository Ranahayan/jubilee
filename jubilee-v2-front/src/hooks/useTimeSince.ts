import { useTranslation } from "react-i18next";

export function useTimeSince(dateInput: Date) {
  const { t } = useTranslation();
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();

  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 60) {
    return t('notifications.second', { count: Math.floor(secondsPast) });
  }

  if (secondsPast < 3600) {
    return t('notifications.minute', { count: Math.floor(secondsPast / 60) });
  }

  if (secondsPast <= 86400) {
    return t('notifications.hour', { count: Math.floor(secondsPast / 3600) });
  }

  if (secondsPast <= 2592000) {
    return t('notifications.day', { count: Math.floor(secondsPast / 86400) });
  }

  if (secondsPast <= 31536000) {
    return t('notifications.month', { count: Math.floor(secondsPast / 2592000) });
  }

  return t('notifications.year', { count: Math.floor(secondsPast / 31536000) });
}