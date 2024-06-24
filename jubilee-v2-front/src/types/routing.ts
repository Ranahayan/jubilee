import { UseQueryResult } from "@tanstack/react-query";
import { CSSProperties, FC } from "react";
import { IconDefinition } from "@fortawesome/pro-light-svg-icons";

export type ISidebarIcon = IconDefinition | FC<{ style?: CSSProperties }>;

export interface IPaths {
  [key: string]: string;
}

export interface IRootPaths {
  [key: string]: IPaths;
}

export interface INavItem {
  namePath: string;
  path: string;
  isNew?: boolean;
  icon?: ISidebarIcon;
  sectionLabel?: string;
  openInNewTab?: boolean;
  getCountQuery?: () => UseQueryResult;
  showHelpCenterModal?: boolean;
  onClick?: () => void;
  isOnlySVG?: boolean;
}
