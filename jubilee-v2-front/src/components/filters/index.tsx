import { SVG } from "~/components/ui/SVG";
import { faAngleDown, faCheck, IconDefinition } from "@fortawesome/pro-regular-svg-icons";
import * as S from "./styles";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useClickOutside from "~/hooks/useClickOutside";
import React from "react";

interface Props {
  value: string[];
  onChange: Dispatch<SetStateAction<any[]>>;
  filters: { labelKey: string; value: any }[];
  icon?: string | IconDefinition | React.ReactNode;
  label: string;
}

export const Filters = ({
  value,
  label,
  onChange,
  filters,
  icon
}: Props) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsDropdownOpen(false));

  const handleSelect = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter((v) => v !== selectedValue));
    } else {
      onChange([...value, selectedValue]);
    }
  };

  return (
    <S.DropdownContainer ref={containerRef}>
      <S.FilterButton onClick={() => setIsDropdownOpen((prev) => !prev)}>
        { icon && !React.isValidElement(icon) && <SVG
          icon={icon as IconDefinition}
          color="text"
          size="sm"
        /> }
        { React.isValidElement(icon) && icon }
        {label} <SVG icon={faAngleDown} />
      </S.FilterButton>

      {isDropdownOpen && (
        <S.DropdownContent>
          {filters.map((option) => (
            <DropdownItem
              key={option.labelKey}
              value={option.value}
              currentValue={value}
              onChange={() => handleSelect(option.value)}
              label={t(option.labelKey)}
            />
          ))}
        </S.DropdownContent>
      )}
    </S.DropdownContainer>
  );
};

interface IDropdownItemProps {
  value: string;
  currentValue: string[];
  onChange: (value: any) => void;
  label: string;
}

const DropdownItem = ({
  value,
  currentValue,
  onChange,
  label,
}: IDropdownItemProps) => {
  const selected = currentValue.includes(value);

  return (
    <S.DropdownItem
      selected={selected}
      onClick={() => {
        onChange(selected ? null : value);
      }}>
      {label}
      {selected && <SVG icon={faCheck} color="primary" size="lg" />}
    </S.DropdownItem>
  );
};
