import { useState } from "react";
import {
  FormFieldConfigs,
  FormFieldValue,
  FormFieldValues,
  IFormHookProps,
  IFormState,
  IFormContextValue,
  IFormSelectValue,
} from "~/types/form";
import { createContext } from "react";

export const FormContext = createContext<IFormContextValue>({});

export const useForm = (config: FormFieldConfigs): IFormHookProps => {
  const [isDirty, setIsDirty] = useState(false);
  const [key, setKey] = useState(1); // Used only for forced re-renders
  const [formState, setFormState] = useState<IFormState>(
    config.reduce(
      (acc, cur) => ({ ...acc, [cur.key]: { error: null, value: "" } }),
      {}
    )
  );

  const loadValues = (values: FormFieldValues) => {
    setFormState((oldState) =>
      Object.keys(values).reduce((acc, cur) => {
        const configItem = config.find((elm) => elm.key === cur);
        let value = values[cur];
        if (configItem && configItem.loadValue) {
          value = configItem.loadValue(values[cur], configItem);
        }
        return {
          ...acc,
          [cur]: { value, error: null, defaultValue: values[cur] },
        };
      }, oldState)
    );
  };

  const cleanValues = () => {
    setFormState((oldState) =>
      Object.keys(formState).reduce((acc, cur) => {
        return {
          ...acc,
          [cur]: { value: "", error: null, defaultValue: "" },
        };
      }, oldState)
    );
    setIsDirty(false);
    setKey((old) => old * 89); // this will never repeat any number
  };

  const getValues = (): FormFieldValues => {
    return Object.keys(formState).reduce((acc, cur) => {
      const currentField = formState[cur];
      let value = currentField.value;

      if (
        !!value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        "value" in (value as IFormSelectValue)
      ) {
        value = (currentField?.value as IFormSelectValue).value;
      }

      return { ...acc, [cur]: value };
    }, {});
  };

  const setFieldProperty =
    (property: "value" | "error") =>
    (key: string) =>
    (value: FormFieldValue | string) => {
      setIsDirty(true);
      setFormState((formState) => ({
        ...formState,
        [key]: { ...formState[key], [property]: value },
      }));
    };

  const setFieldError = setFieldProperty("error");

  const validate = () => {
    let hasZeroErrors = true;

    Object.keys(formState).forEach((key) => {
      const fieldConfig = config.find((elm) => elm.key === key);
      if (fieldConfig?.isRequired && !formState[key].value) {
        setFieldError(key)("This field is required.");
        hasZeroErrors = false;
      }

      if (fieldConfig?.validation) {
        const validationErr = fieldConfig.validation(formState[key].value);
        if (validationErr) {
          setFieldError(key)(validationErr);
          hasZeroErrors = false;
        }
      }
    });

    return hasZeroErrors;
  };

  const forceRerender = () => {
    setKey((old) => old * 89); // this will never repeat any number
  };

  return {
    setFieldValue: setFieldProperty("value"),
    setFieldError,
    validate,
    hasErrors: Object.values(formState).some(({ error }) => error),
    loadValues,
    getValues,
    isDirty,
    formState,
    formConfig: config,
    key,
    cleanValues,
    forceRerender,
  };
};
