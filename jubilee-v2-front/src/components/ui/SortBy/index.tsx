import * as S from "./styles";
import { UIFlexProps } from "~/types/style";
import Select from "react-select";
import { IFormSelectValue } from "~/types/form";
import {
  faArrowUpWideShort,
  faArrowDownWideShort,
} from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import { useState } from "react";

type OrderType = "ASC" | "DESC";

interface ISortByProps extends UIFlexProps {
  value?: IFormSelectValue;
  options?: IFormSelectValue[];
  label: string;
  placeholder?: string;
  hasOrderDirection?: boolean;
  defaultOrder?: OrderType;
  onChange?: (value: IFormSelectValue) => void;
  onChangeOrder?: (order: OrderType) => void;
}

const SortBy = ({
  value,
  options,
  label,
  onChange,
  onChangeOrder,
  placeholder,
  defaultOrder = "ASC",
  hasOrderDirection,
  ...rest
}: ISortByProps) => {
  const [isAscOrder, setIsAscOrder] = useState(defaultOrder === "ASC");

  const handleChangeOrder = () => {
    onChangeOrder && onChangeOrder(!isAscOrder ? "ASC" : "DESC");
    setIsAscOrder(!isAscOrder);
  };

  return (
    <S.SortBy {...rest}>
      <span>{label}</span>
      <Select
        isSearchable={false}
        value={value}
        placeholder={placeholder}
        onChange={(value) => onChange && onChange(value as IFormSelectValue)}
        options={options}
        classNamePrefix={"react-select"}
      />
      {hasOrderDirection ? (
        <div onClick={handleChangeOrder}>
          <SVG
            icon={
              (isAscOrder ? faArrowUpWideShort : faArrowDownWideShort) as Icon
            }
          />
        </div>
      ) : null}
    </S.SortBy>
  );
};

export default SortBy;
