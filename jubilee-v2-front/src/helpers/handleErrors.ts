import { DefaultTFuncReturn } from "i18next";
import { toast } from "~/components/toast";
import { IToastOptions, ToastId, ToastType } from "~/components/toast/types";
import { triggerShowPlansModal } from "~/helpers/customEvents";

export type ToastMessage = {
  loading?:
    | DefaultTFuncReturn
    | { body: React.ReactNode; options?: IToastOptions };
  success?:
    | DefaultTFuncReturn
    | { body: React.ReactNode; options?: IToastOptions };
  error?:
    | DefaultTFuncReturn
    | { body: React.ReactNode; options?: IToastOptions };
};

type ResponseWithError<T = any> =
  | { response: null; errors: string[] }
  | { response: T; errors: null };

enum ErrorCode {
  REQUIRES_UPGRADE = 1,
}

const fromToastMessage = (
  type: ToastType,
  message?:
    | DefaultTFuncReturn
    | { body: React.ReactNode; options?: IToastOptions },
  toastId?: ToastId
) => {
  if (!message) {
    if (toastId) {
      toast.dismiss(toastId);
    }

    return;
  }

  if (typeof message === "string") {
    return toast.updateOrCreate(toastId, {
      type,
      render: message,
    });
  }

  return toast.updateOrCreate(toastId, {
    type,
    render: message.body,
    ...message.options,
  });
};

const handleErrors = async <T = any>(
  promise: () => Promise<T>,
  toasts: ToastMessage
): Promise<ResponseWithError<T>> => {
  const toastId = fromToastMessage("info", toasts.loading);

  try {
    const response = await promise();
    if (toasts.success) fromToastMessage("success", toasts.success, toastId);
    return { response, errors: null };
  } catch (error: any) {
    const handleFormErrors = (errorData: Record<string, string[]>) => {
      const newErrors: Record<string, string> = {};
      Object.keys(errorData).forEach((key) => {
        newErrors[key] = errorData[key][0];
      });
      return Object.values(newErrors);
    };

    let errors: string[] | null = [];
    const errorData = error.response?.status;

    if (errorData === 400 || errorData === 402 || errorData === 404) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail;

      if (error.response?.data?.error_code === ErrorCode.REQUIRES_UPGRADE) {
        triggerShowPlansModal();
      }

      if (message) {
        fromToastMessage("error", message, toastId);

        return { response: null, errors: [message] };
      }

      if (/text\/html/.test(error?.response?.headers?.["content-type"])) {
        fromToastMessage("error", toasts.error, toastId);
      } else {
        errors = handleFormErrors(error?.response?.data);

        if (errors.length) {
          fromToastMessage("error", errors[0], toastId);
        }
      }
    } else {
      fromToastMessage("error", toasts.error, toastId);
    }

    return {
      response: null,
      errors: errors.length ? errors : [error.toString()],
    };
  }
};

export default handleErrors;
