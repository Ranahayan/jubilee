import { QueryKey } from "@tanstack/react-query";
import { UIFlexProps, UIInputVariant } from "~/types/style";
import { IFile } from "./upload";
import { IProductOption } from "./productOption";
import { ISquareOption } from "./squareOption";
import { IAssetOption } from "./AssetUploader";
import { SVGIcon } from "~/components/ui/SVG/types";
import { DebouncedFunc } from "lodash";

export type SelectOptions = Array<string | number> | string | number;

export type FormFieldType =
  | "number"
  | "string"
  | "email"
  | "password"
  | "select"
  | "textarea"
  | "card"
  | "card-smartli"
  | "tag"
  | "color-picker"
  | "product-select"
  | "square-select"
  | "assets-uploader"
  | "box-radio"
  | "async-select"
  | "hidden"
  | "file"
  | "custom";

export type FormFieldValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | SelectOptions
  | IFile
  | IFormSelectValue
  | ISquareOption
  | IFile[];

export type FormFieldValues = Record<string, FormFieldValue>;

export interface IFormFieldConfig {
  type: FormFieldType;
  key: string;
  labelKey?: string;
  placeholder?: string;
  validation?: (value: FormFieldValue) => string | null;
  prefixKey?: string;
  size?: number;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  labelAlign?: UIFlexProps["alignItems"];
  variant?: UIInputVariant;
  options?: Array<
    IFormSelectValue | IProductOption | ISquareOption | IAssetOption | unknown
  >;
  optionsQueryKey?: QueryKey;
  selectValueKey?: string;
  selectLabelKey?: string;
  isHidden?: boolean;
  isMulti?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean; // only for select type, change to FormFieldConfigs<>
  limitFeature?: string;
  defaultValue?: FormFieldValue;
  loadOptions?: (
    inputValue: string
  ) => Promise<IFormSelectValue[]> | DebouncedFunc<any>;
  isShopRequired?: boolean;
  defaultOptions?: boolean;
  onMenuScrollToBottom?: (event: WheelEvent | TouchEvent) => void;
  icon?: SVGIcon;
  borderColor?: string;
  max?: number;
  min?: number;
  filetypes?: string[];
  loadValue?: (
    value: FormFieldValue,
    config: IFormFieldConfig
  ) => FormFieldValue;
  componentToRender?: React.ComponentType<any>;
  noStandardValidationForm?: boolean;
  validationOnSubmit?: boolean;
}

export type FormFieldConfigs = Array<IFormFieldConfig>;

export interface IFormSelectValue {
  value: string | boolean;
  label: string;
}

export interface IFormStateValue {
  value: FormFieldValue;
  error: string | null;
}

export interface IFormState {
  [key: string]: IFormStateValue;
}

export interface IFormHookProps {
  setFieldValue: (key: string) => (value: FormFieldValue) => void;
  setFieldError: (key: string) => (value: FormFieldValue) => void;
  validate: () => boolean;
  loadValues: (values: FormFieldValues) => void;
  getValues: () => FormFieldValues;
  cleanValues: () => void;
  isDirty: boolean;
  hasErrors: boolean;
  horizontalLabel?: boolean;
  key: number;
  formState: IFormState;
  formConfig: FormFieldConfigs;
  forceRerender?: () => void;
}

export interface IFormContextValue {
  uploadFile?: (file: File) => Promise<unknown>;
}
