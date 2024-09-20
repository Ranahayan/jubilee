import { TypeOptions } from "react-toastify";
import { Id, ToastProps } from "react-toastify/dist/types";
import { SVGIcon } from "~/components/ui/SVG/types";

export type ToastId = Id;

export type ToastType = Exclude<TypeOptions, "default">;

export interface IToastOptions {
  title?: string;
  icon?: SVGIcon;
  inlineAction?: { label: string; onClick: (toastId: Id) => void };
}

export type IBuildToast = (
  body: React.ReactNode,
  options?: IToastOptions
) => ToastId;

export interface IToastProps extends IToastOptions {
  closeToast?: () => void;
  toastProps: ToastProps;

  children: React.ReactNode;
}

export interface IUpdateOptions extends IToastOptions {
  type?: ToastType;
  render: React.ReactNode;
}
