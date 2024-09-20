import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IFormFieldConfig,
  FormFieldValue,
  IFormHookProps,
  IFormSelectValue,
} from "~/types/form";
import { SVG } from "~/components/ui/SVG";
import _debounce from "lodash/debounce";

import * as S from "./styles";
import Input from "~/components/ui/Input";
import { useTranslation } from "react-i18next";
import Label from "../Label";
import { useQueryClient } from "@tanstack/react-query";
import { Options } from "react-select";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import { faCrown } from "@fortawesome/pro-solid-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IFormFieldProps {
  fieldConfig: IFormFieldConfig;
  value: FormFieldValue;
  error: string | null;
  setFieldValue: (value: FormFieldValue) => void;
  setFieldError: (value: FormFieldValue) => void;
  defaultValue?: FormFieldValue;
  onShopIsRequired?: () => void;
}

export const FormField: React.FC<IFormFieldProps> = ({
  fieldConfig,
  setFieldValue,
  setFieldError,
  value,
  error,
  defaultValue,
  onShopIsRequired,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const selectOptions = useMemo<Options<any>>(() => {
    const selects = [
      "select",
      "product-select",
      "square-select",
      "assets-uploader",
      "async-select",
      "box-radio",
      "custom",
    ];
    if (!selects.includes(fieldConfig.type)) return [];
    if (fieldConfig.options) return fieldConfig.options;
    if (fieldConfig.optionsQueryKey) {
      const data = queryClient.getQueryData(
        fieldConfig.optionsQueryKey
      ) as Array<any>; // WARNING: Data can theoretically be in any shape
      if (data) return data;
    }
    return [];
  }, [
    fieldConfig.options,
    fieldConfig.optionsQueryKey,
    queryClient.isFetching(),
  ]);

  const validate = (val: FormFieldValue) => {
    let errorMsg: string | null = null;
    const skipValidation = ["card", "card-smartli"];

    if (
      fieldConfig.isRequired &&
      !val &&
      !skipValidation.includes(fieldConfig.type)
    ) {
      errorMsg = "This field is required.";
    }

    if (fieldConfig.validation) {
      const validationErr = fieldConfig.validation(val);
      if (validationErr) errorMsg = validationErr;
    }

    setFieldError(errorMsg);
  };

  const debouncedValidate = useCallback(_debounce(validate, 500), []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onBlur = () => {
    validate(value);
  };

  const onChangeNative = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(e.target.value);
    debouncedValidate(e.target.value);
  };

  const onChangeCustom = (value: FormFieldValue) => {
    setFieldValue(value);
    debouncedValidate(value);
  };

  const onFocus = () => {
    if (fieldConfig.isShopRequired) {
      onShopIsRequired && onShopIsRequired();
    }
  };
  const isPasswordField = fieldConfig.type === "password";

  const passwordToggle = isPasswordField ? (
    <S.PasswordToggle onClick={togglePasswordVisibility}>
      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
    </S.PasswordToggle>
  ) : null;

  if (fieldConfig.isHidden) return null;
  const RenderComponent = fieldConfig.componentToRender || Input;

  return (
    <S.FieldWrapper>
      <RenderComponent
        onBlur={onBlur}
        type={isPasswordField && showPassword ? "text" : fieldConfig.type}
        options={selectOptions}
        onChange={onChangeNative}
        onChangeCustom={onChangeCustom}
        onFocus={onFocus}
        value={value || undefined}
        defaultValue={defaultValue || undefined}
        error={error || undefined}
        placeholder={
          fieldConfig.placeholder
            ? (t(fieldConfig.placeholder) as string)
            : undefined
        }
        selectLabelKey={fieldConfig.selectLabelKey}
        selectValueKey={fieldConfig.selectValueKey}
        isMulti={fieldConfig.isMulti}
        isClearable={fieldConfig.isClearable}
        isDisabled={fieldConfig.isDisabled}
        prefix={
          fieldConfig.prefixKey ? (t(fieldConfig.prefixKey) as string) : undefined
        }
        style={fieldConfig.style}
        wrapperStyle={fieldConfig.wrapperStyle}
        max={fieldConfig.max}
        min={fieldConfig.min}
        loadOptions={
          fieldConfig.loadOptions as (
            inputValue: string
          ) => Promise<IFormSelectValue[]>
        }
        defaultOptions={fieldConfig.defaultOptions}
        onMenuScrollToBottom={fieldConfig.onMenuScrollToBottom}
        borderColor={fieldConfig.borderColor}
        filetypes={fieldConfig.filetypes}
      />
      {passwordToggle}
    </S.FieldWrapper>
  );
};

type FormHooks = {
  noMargin?: boolean;
  noInnerMargin?: boolean;
  upgradeIcon?: Icon;
  onShopIsRequired?: () => void;
  fieldKey?: string;
  filterFields?: string[];
};

export const Form: React.FC<FormHooks & IFormHookProps> = ({
  setFieldValue,
  setFieldError,
  onShopIsRequired,
  formState,
  formConfig,
  horizontalLabel,
  noMargin = false,
  noInnerMargin = false,
  upgradeIcon,
  filterFields,
}) => {
  const { t } = useTranslation();
  const filteredFormConfig = filterFields
    ? formConfig.filter((fieldConfig) => filterFields.includes(fieldConfig.key))
    : formConfig;

  return (
    <S.Grid noMargin={noMargin}>
      {filteredFormConfig.map((fieldConfig: IFormFieldConfig) =>
        fieldConfig.type === "hidden" ? null : (
          <S.GridItem
            key={fieldConfig.key}
            cols={fieldConfig.size || 12}
            noInnerMargin={noInnerMargin}>
            <Label
              width={horizontalLabel ? "50%" : "fit-content"}
              flexDirection={horizontalLabel ? "row" : "column"}
              text={fieldConfig.labelKey ? t(fieldConfig.labelKey) : null}
              alignItems={fieldConfig.labelAlign || "flex-start"}
              small
              prefixComponent={
                fieldConfig.limitFeature ? (
                  <SVG
                    icon={upgradeIcon || (faCrown as Icon)}
                    color="#FFA41C"
                  />
                ) : null
              }>
              <FormField
                fieldConfig={fieldConfig}
                setFieldValue={setFieldValue(fieldConfig.key)}
                setFieldError={setFieldError(fieldConfig.key)}
                onShopIsRequired={onShopIsRequired}
                defaultValue={fieldConfig.defaultValue}
                {...formState[fieldConfig.key]}
              />
            </Label>
          </S.GridItem>
        )
      )}
    </S.Grid>
  );
};
