import { SVG } from "~/components/ui/SVG";
import { faAngleDown, faCheck } from "@fortawesome/pro-regular-svg-icons";
import * as S from "./styles";
import { useRef, useState } from "react";
import _ from "lodash";
import { Sorting, sortingOptions } from "~/constants/product-sorting";
import { useTranslation } from "react-i18next";
import useClickOutside from "~/hooks/useClickOutside";

interface ISortByButtonProps {
  sorting: Sorting;
  updateSorting: (newSorting: Sorting) => void;
}

export const SortByButton = ({
  sorting,
  updateSorting,
}: ISortByButtonProps) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsDropdownOpen(false));

  return (
    <S.DropdownContainer ref={containerRef}>
      <S.SortButton onClick={() => setIsDropdownOpen((prev) => !prev)}>
        {t("dropshipping.sort_by")} <SVG icon={faAngleDown} />
      </S.SortButton>

      {isDropdownOpen && (
        <S.DropdownContent>
          {sortingOptions.map((option) => (
            <DropdownItem
              key={option.labelKey}
              value={option.value}
              currentSorting={sorting}
              updateSorting={updateSorting}
              closeDropdown={() => setIsDropdownOpen(false)}
              label={t(option.labelKey)}
            />
          ))}
        </S.DropdownContent>
      )}
    </S.DropdownContainer>
  );
};

interface IDropdownItemProps {
  value: Sorting;
  currentSorting: Sorting;
  updateSorting: (newSorting: Sorting) => void;
  label: string;
  closeDropdown: () => void;
}

const DropdownItem = ({
  value,
  currentSorting,
  updateSorting,
  closeDropdown,
  label,
}: IDropdownItemProps) => {
  const selected = _.isEqual(value, currentSorting);

  return (
    <S.SortDropdownItem
      selected={selected}
      onClick={() => {
        updateSorting(selected ? null : value);
        closeDropdown();
      }}>
      {label}

      {selected && <SVG icon={faCheck} color="primary" size="lg" />}
    </S.SortDropdownItem>
  );
};
