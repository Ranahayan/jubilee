import { DefaultTFuncReturn } from "i18next";
import { Key } from "react";

interface BreadcrumbItemBase {
  key?: Key;
  hidden?: boolean;
}

export type BreadcrumbItem = BreadcrumbItemBase &
  (
    | {
        type: "button";
        label: DefaultTFuncReturn;
        onClick: () => void;
      }
    | { type: "text"; label: DefaultTFuncReturn }
  );
