import { FormFieldConfigs, IFormHookProps } from "~/types/form";
import { IUnderlineTab } from "./tabs";
import { SVGIcon } from "~/components/ui/SVG/types";

export type CustomizationValue = boolean | string;

export interface CustomizationSection {
  fields: FormFieldConfigs;
  labelKey?: string;
  showUpgradeIcon?: boolean;
  hasAccess?: () => boolean;
  description?: string;
}

export interface CustomizationTab extends IUnderlineTab {
  sections?: CustomizationSection[];
}

export interface ICustomizationConfig {
  tabs: CustomizationTab[];
}

export interface ICustomization extends ICustomizationConfig {
  returnUrl: string;
  handleAction?: () => void;
  handleDownload?: () => void;
  onTabChange?: (tabIndex: number) => void;
  form: IFormHookProps;
  children?: React.ReactNode;
  checkRemoveBranding?: boolean;
  handleRemoveBranding?: () => void;
  disableRemoveBranding?: boolean;
  disabled?: boolean;
  hideTabs?: boolean;
  iconButtonSave?: SVGIcon;
}
