import { IconDefinition } from "@fortawesome/pro-light-svg-icons";

export type Tab = {
  labelKey: string;
  path: string;
  icon: IconDefinition;
};

export type TabProps = {
  tab: Tab;
  isActive?: boolean;
};

export type TabsProps = {
  tabs: Array<Tab>;
  children?: React.ReactNode;
  bgColor?: string;
  flexDirection?: "row" | "column";
};

export type IUnderlineTab = {
  labelKey: string;
  isActive?: boolean;
  icon?: IconDefinition;
  isDisabled?: boolean;
};
