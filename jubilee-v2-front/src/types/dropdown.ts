import { MouseEventHandler } from "react";
import { SVGIcon } from "~/components/ui/SVG/types";

export interface IDropdownItem {
  name: string;
  icon: SVGIcon;
  onClick: MouseEventHandler<HTMLButtonElement>;
}
