import "react-toastify/dist/ReactToastify.min.css";
import { toast as toastifyToast } from "react-toastify";
import * as S from "./styles";
import { SVG } from "~/components/ui/SVG";
import {
  faCircle,
  faExclamationCircle,
  faWarning,
  faX,
  faXmarkCircle,
} from "@fortawesome/pro-regular-svg-icons";
import { useTranslation } from "react-i18next";
import {
  IBuildToast,
  IToastProps,
  IUpdateOptions,
  ToastId,
  ToastType,
} from "./types";
import { SVGIcon } from "~/components/ui/SVG/types";

const defaultIcons = {
  info: faExclamationCircle,
  success: faCircle,
  warning: faWarning,
  error: faXmarkCircle,
} satisfies Record<ToastType, SVGIcon>;

export const ToastContainer = () => {
  return (
    <S.ToastContainer
      position="top-right"
      autoClose={5000}
      icon={false}
      closeButton={false}
      hideProgressBar
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
};

const Toast = ({
  closeToast,
  toastProps,
  children,
  title,
  icon,
  inlineAction,
}: IToastProps) => {
  const { t } = useTranslation();
  const type = toastProps.type === "default" ? "info" : toastProps.type;

  return (
    <div>
      <S.Header type={type}>
        <S.HeaderIcon icon={icon ?? defaultIcons[type]} size="xs" type={type} />
        <S.Title type={type}>{title ?? t(`toast.${toastProps.type}`)}</S.Title>

        {/* @ts-ignore */}
        <S.CloseButton onClick={closeToast} type={type}>
          <SVG icon={faX} size="xs" />
        </S.CloseButton>
      </S.Header>

      <S.Body>
        {children}

        {inlineAction && (
          <>
            {" "}
            <S.InlineAction
              onClick={() => inlineAction.onClick(toastProps.toastId)}>
              {inlineAction.label}
            </S.InlineAction>
          </>
        )}
      </S.Body>
    </div>
  );
};

const buildToast =
  ({ type }: { type: ToastType }): IBuildToast =>
  (body, options) => {
    toastifyToast.dismiss();

    return toastifyToast(
      ({ toastProps, closeToast }) => (
        <Toast toastProps={toastProps} closeToast={closeToast} {...options}>
          {body}
        </Toast>
      ),
      { type }
    );
  };

const toastBuilders = {
  info: buildToast({ type: "info" }),
  success: buildToast({ type: "success" }),
  warning: buildToast({ type: "warning" }),
  error: buildToast({ type: "error" }),
} satisfies Record<ToastType, IBuildToast>;

const update = (
  toastId: ToastId,
  { render, type, ...options }: IUpdateOptions
) =>
  toastifyToast.update(toastId, {
    render: ({ toastProps, closeToast }) => (
      <Toast toastProps={toastProps} closeToast={closeToast} {...options}>
        {render}
      </Toast>
    ),
    type,
  });

export const toast = {
  ...toastBuilders,

  update,

  updateOrCreate: (
    toastId: ToastId | undefined | null,
    options: IUpdateOptions
  ) => {
    if (toastId) {
      update(toastId, options);
      return toastId;
    }

    const { type, render, ...rest } = options;
    return toastBuilders[type ?? "info"](render, rest);
  },

  dismiss: toastifyToast.dismiss,
};
