import { useMemo, lazy } from "react";
import { FormFieldType, FormFieldValue, IFormSelectValue } from "~/types/form";
import { Options } from "react-select";
import { IProductOption } from "~/types/productOption";
import { ISquareOption } from "~/types/squareOption";
import * as S from "./styles";
import { IAssetOption } from "~/types/AssetUploader";
import { BoxRadio } from "../Radio/boxRadio";

const CardInputWrapper = lazy(() => import("../CardInput"));
const TagInput = lazy(() => import("../TagInput"));
const CardInputSmartliWrapper = lazy(() => import("../CardInputSmartli"));
const Select = lazy(() => import("react-select"));
const ColorPicker = lazy(() => import("../ColorPicker"));
const ProductSelect = lazy(() => import("../ProductSelect"));
const SquareSelect = lazy(() => import("../SquareSelect"));
const AssetUploader = lazy(() => import("../AssetUploader"));
const AsyncSelect = lazy(() => import("../AsyncSelect"));
const InputFile = lazy(() => import("../InputFile"));

export interface IProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    "value"
  > {
  type: FormFieldType | "text";
  prefix?: string;
  error?: string;
  isDisabled?: boolean;
  selectLabelKey?: string;
  selectValueKey?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  options?: Options<any> | ISquareOption[] | IAssetOption[];
  value?: FormFieldValue | any;
  defaultValue?: FormFieldValue | any;
  onOptionSelect?: (value: FormFieldValue) => void;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  onPaymentMethodChange?: (value: FormFieldValue) => void;
  onTokenChange?: (value: FormFieldValue) => void;
  onChangeCustom?: (value: FormFieldValue) => void;
  loadOptions?: (inputValue: string) => Promise<IFormSelectValue[]>;
  defaultOptions?: boolean;
  onMenuScrollToBottom?: (event: WheelEvent | TouchEvent) => void;
  borderColor?: string;
  max?: number;
  min?: number;
  filetypes?: string[];
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const Input = ({
  type,
  onChange,
  onOptionSelect,
  onPaymentMethodChange,
  onTokenChange,
  onChangeCustom,
  onFocus,
  prefix,
  isDisabled,
  error,
  value,
  defaultValue,
  options,
  selectLabelKey,
  selectValueKey,
  isMulti,
  isClearable,
  isSearchable,
  placeholder,
  style,
  wrapperStyle,
  onBlur,
  loadOptions,
  defaultOptions,
  onMenuScrollToBottom,
  borderColor,
  max,
  min,
  filetypes,
  onKeyDown
}: IProps) => {
  const handleDeprecatedChange = (
    deprecatedHandle: ((value: FormFieldValue) => void) | undefined
  ) => {
    return (value: FormFieldValue) => {
      if (deprecatedHandle) {
        console.warn(
          "Deprecated: Try use the onChangeCustom instead of onTokenChange, onPaymentMethodChange, etc."
        );
        return deprecatedHandle(value);
      }
      onChangeCustom && onChangeCustom(value);
    };
  };

  const inputComponent = useMemo(() => {
    switch (type) {
      case "box-radio":
        return (
          <BoxRadio
            onChange={onChangeCustom}
            value={value}
            disable={isDisabled}
            options={options as ISquareOption[]}
          />
        );
      case "assets-uploader":
        return (
          <AssetUploader
            onChange={onChangeCustom}
            disabled={isDisabled}
            fileOptions={options as IAssetOption[]}
            files={value}
          />
        );
      case "card":
        return (
          <CardInputWrapper
            error={error}
            onPaymentMethodChange={handleDeprecatedChange(
              onPaymentMethodChange
            )}
          />
        );
      case "card-smartli":
        return (
          <CardInputSmartliWrapper
            error={error}
            onTokenChange={handleDeprecatedChange(onTokenChange)}
          />
        );
      case "tag":
        return (
          <TagInput
            value={value}
            onChange={handleDeprecatedChange(onOptionSelect)}
            placeholder={placeholder}
          />
        );
      case "string":
      case "number":
      case "email":
      case "password":
      case "text":
        return (
          <input
            readOnly={isDisabled}
            value={value}
            defaultValue={defaultValue}
            type={type === "text" ? "text" : type}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={placeholder}
            style={style}
            max={max}
            min={min}
            onKeyDown={onKeyDown}
          />
        );
      case "async-select":
        return (
          <AsyncSelect
            onFocus={onFocus}
            isClearable={isClearable}
            isSearchable={isSearchable}
            value={value}
            isDisabled={isDisabled}
            placeholder={placeholder}
            onChange={onChangeCustom}
            options={options as IFormSelectValue[]}
            loadOptions={loadOptions}
            defaultOptions={defaultOptions}
            onMenuScrollToBottom={onMenuScrollToBottom}
          />
        );
      case "select":
        return (
          <Select
            options={options}
            onFocus={onFocus}
            isDisabled={isDisabled}
            classNamePrefix={"react-select"}
            isMulti={isMulti}
            defaultValue={defaultValue}
            getOptionLabel={(
              option //@ts-ignore
            ) => (selectLabelKey ? option[selectLabelKey] : option.label)}
            getOptionValue={(
              option //@ts-ignore
            ) => (selectValueKey ? option[selectValueKey] : option.value)}
            value={value} //@ts-ignore
            onChange={handleDeprecatedChange(onOptionSelect)}
            isClearable={isClearable}
            placeholder={placeholder}
          />
        );
      case "textarea":
        return (
          <S.TextArea
            onFocus={onFocus}
            style={style}
            disabled={isDisabled}
            onChange={onChange}
            value={value}
          />
        );
      case "color-picker":
        return (
          <ColorPicker
            value={value}
            isDisabled={isDisabled}
            onChange={onChangeCustom}>
            {placeholder}
          </ColorPicker>
        );
      case "product-select":
        return (
          <ProductSelect
            options={options as Options<IProductOption>}
            isDisabled={isDisabled}
            onFocus={onFocus}
            selectLabelKey={selectLabelKey}
            selectValueKey={selectValueKey}
            value={value}
            onChange={onChangeCustom}
            isClearable={isClearable}
            placeholder={placeholder}
          />
        );
      case "square-select":
        return (
          <SquareSelect
            options={options as ISquareOption[]}
            value={value}
            onChange={onChangeCustom}
            isDisabled={isDisabled}
          />
        );
      case "file":
        return (
          <InputFile
            value={value}
            types={filetypes || []}
            isDisabled={isDisabled}
            placeholder={placeholder}
            onChange={onChangeCustom}
          />
        );
      default:
        return null;
    }
  }, [type, isDisabled, value, options, defaultValue]);

  const classNames = useMemo(() => {
    const list: string[] = [type];
    const skipHighlight = ["color-picker", "square-select"];

    if (error) list.push("error");
    if (isDisabled) list.push("disabled");
    if (skipHighlight.includes(type)) list.push("disable-highlight");

    return list.join(" ");
  }, [error, isDisabled]);

  return (
    <>
      <S.InputWrapper
        className={classNames}
        style={wrapperStyle}
        color={borderColor || "borderSecondary"}>
        {prefix && <S.Prefix>{prefix}</S.Prefix>}
        {inputComponent}
        {error && <S.Error>{error}</S.Error>}
      </S.InputWrapper>
    </>
  );
};

export default Input;
