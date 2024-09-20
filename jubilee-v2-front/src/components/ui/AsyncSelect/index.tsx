import Select from "react-select/async";
import { FormFieldValue, IFormSelectValue } from "~/types/form";
import { FocusEventHandler } from "react";

interface IProps {
  placeholder?: string;
  isDisabled?: boolean;
  selectLabelKey?: string;
  selectValueKey?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  value?: FormFieldValue | any;
  onChange?: (value: FormFieldValue) => void;
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  loadOptions?: (inputValue: string) => Promise<IFormSelectValue[]>;
  onMenuScrollToBottom?: (event: WheelEvent | TouchEvent) => void;
  options?: IFormSelectValue[];
  defaultOptions?: boolean;
}

const AsyncSelect = ({
  value,
  isDisabled,
  isClearable,
  placeholder,
  onChange,
  onFocus,
  isSearchable,
  loadOptions,
  onMenuScrollToBottom,
  options = [],
  defaultOptions,
}: IProps) => {
  return (
    <Select
      isSearchable={isSearchable}
      loadOptions={loadOptions}
      cacheOptions
      defaultOptions={defaultOptions || options}
      classNamePrefix={"react-select"}
      isDisabled={isDisabled}
      onFocus={onFocus}
      value={value}
      isClearable={isClearable}
      placeholder={placeholder}
      onChange={onChange}
      onMenuScrollToBottom={onMenuScrollToBottom}
    />
  );
};

export default AsyncSelect;
