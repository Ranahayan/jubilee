import { Limits } from "~/types/billing";
import { DISABLE_PAYMENTS } from "./plans";

export const SHOW_PLANS_MODAL = "show-plans-modal";
export const SHOW_RESUME_MODAL = "show-resume-modal";
export const SHOW_LIMITS_MODAL = "SHOW_LIMITS_MODAL";
export const SHOW_NOTIFICATIONS = "SHOW_NOTIFICATIONS";
export const SHOW_CONNECT_STORE_MODAL = "SHOW_CONNECT_STORE_MODAL";

export const triggerShowPlansModal = (
  hideCloseButton = false,
  initialIsAnnual = false
) => {
  if (DISABLE_PAYMENTS) return;

  const event = new CustomEvent(SHOW_PLANS_MODAL, {
    detail: { hideCloseButton, initialIsAnnual },
  });
  window.dispatchEvent(event);
};

export const triggerShowResumeModal = () => {
  const event = new CustomEvent(SHOW_RESUME_MODAL, {});
  window.dispatchEvent(event);
};

export const triggerShowLimitsModal = (limitType: Limits) => {
  if (DISABLE_PAYMENTS) return;

  const event = new CustomEvent(SHOW_LIMITS_MODAL, { detail: { limitType } });
  window.dispatchEvent(event);
};

export const triggerShowNotifications = () => {
  const event = new CustomEvent(SHOW_NOTIFICATIONS, {});
  window.dispatchEvent(event);
}

export const triggerShowConnectStoreModal = () => {
  const event = new CustomEvent(SHOW_CONNECT_STORE_MODAL, {});
  window.dispatchEvent(event);
}