import Select, {
  components,
  Options,
  ControlProps,
  OptionProps,
  SingleValueProps,
  MenuProps,
} from "react-select";
import { FormFieldValue } from "~/types/form";
import { SVG } from "~/components/ui/SVG";
import { faMagnifyingGlass, faStar } from "@fortawesome/pro-solid-svg-icons";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import { FocusEventHandler, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IProductOption } from "~/types/productOption";
import * as S from "./styles";

interface IProps {
  placeholder?: string;
  isDisabled?: boolean;
  selectLabelKey?: string;
  selectValueKey?: string;
  isClearable?: boolean;
  options: Options<IProductOption>;
  value?: FormFieldValue | any;
  onChange?: (value: FormFieldValue) => void;
  onInputChange?: (value: string) => void;
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

const Control = ({
  children,
  ...props
}: ControlProps<IProductOption, false>) => {
  const { isSearchable, menuIsOpen } = props.selectProps;
  const values = props.getValue();
  const selected = values.length && values[0];

  return (
    <components.Control {...props}>
      {selected && !(isSearchable && menuIsOpen) ? (
        <S.ImageIcon width={4} height={4} src={selected.icon} />
      ) : (
        <S.SelectIcon size="lg" icon={faMagnifyingGlass as Icon} />
      )}
      {children}
    </components.Control>
  );
};

const SingleValue = ({
  data,
  selectProps,
}: SingleValueProps<IProductOption>) => {
  const { isSearchable, menuIsOpen } = selectProps;
  const { t } = useTranslation();

  if (isSearchable && menuIsOpen) return null;
  return (
    <S.OptionContent>
      <label>{data.label}</label>
      {data.rate !== undefined && (
        <S.Reviews>
          {data.rate} <SVG icon={faStar as Icon} />
          <span>
            {data.reviews}{" "}
            {t("spocket_ui.product_select.reviews", "reviews(s)")}
          </span>
        </S.Reviews>
      )}
    </S.OptionContent>
  );
};

const ProductOption: any = ({
  innerProps,
  label,
  data,
  getValue,
}: OptionProps) => {
  const option: IProductOption = data as IProductOption;
  const selected: IProductOption = getValue()[0] as IProductOption;
  const { t } = useTranslation();

  return (
    <S.Option onClick={innerProps.onClick}>
      <S.Checkbox isChecked={(selected && selected.value) === option.value} />
      <S.ImageIcon width={4} height={4} src={option.icon} />
      <S.OptionContent>
        <label>{label}</label>
        {option.rate !== undefined && (
          <S.Reviews>
            {option.rate} <SVG icon={faStar as Icon} />
            <span>
              {option.reviews}{" "}
              {t("spocket_ui.product_select.reviews", "reviews(s)")}
            </span>
          </S.Reviews>
        )}
      </S.OptionContent>
    </S.Option>
  );
};

const Menu = (props: MenuProps) => {
  const { t } = useTranslation();
  return (
    <components.Menu {...props}>
      <S.MenuHeader>
        {t("spocket_ui.product_select.subtitle", "Select any product")}
      </S.MenuHeader>
      {props.children}
    </components.Menu>
  );
};

const ProductSelect = ({
  value,
  isDisabled,
  options,
  isClearable,
  selectLabelKey,
  selectValueKey,
  placeholder,
  onChange,
  onInputChange,
  onFocus,
}: IProps) => {
  const hasRate = useMemo(() => {
    return options?.length > 0 && options[0].rate !== undefined;
  }, [options]);

  return (
    <S.SelectWrapper hasRate={hasRate}>
      <Select
        options={options}
        components={{
          Menu,
          Control,
          SingleValue,
          Option: ProductOption,
        }}
        isDisabled={isDisabled}
        onFocus={onFocus}
        classNamePrefix={"react-select"}
        getOptionLabel={(option: any) =>
          selectLabelKey ? option[selectLabelKey] : option.label
        }
        getOptionValue={(option: any) =>
          selectValueKey ? option[selectValueKey] : option.value
        }
        value={value}
        isClearable={isClearable}
        placeholder={placeholder}
        onChange={onChange}
        onInputChange={onInputChange}
      />
    </S.SelectWrapper>
  );
};

export default ProductSelect;
