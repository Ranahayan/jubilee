import { useEffect, useRef, useState } from "react";
import * as S from "./styles";
import { SVG } from "../SVG";
import { faAngleDown } from "@fortawesome/pro-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import useClickOutside from "~/hooks/useClickOutside";

export interface ICategories {
  id: number;
  name: string;
  is_visible: boolean;
  image: string;
}

type Props = {
  rows: number;
  columns: number;
  topLevelCategories: ICategories[];
  dropdownCategories?: ICategories[];
  fillRow?: string;
  onClick: (category: ICategories) => void;
};

const Categories = ({
  topLevelCategories = [],
  dropdownCategories = [],
  rows,
  columns,
  fillRow,
  onClick,
}: Props) => {
  const { t } = useTranslation();
  const [dropdownSide, setDropdownSide] = useState<null | "left" | "right">(
    null
  );
  const isAboveLaptopL = useMediaQuery("laptopL");
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const calculateDropdownSide = () => {
    if (!dropdownContainerRef.current) return null;

    if (!isAboveLaptopL) return "right";

    const { x: containerX } =
      dropdownContainerRef.current.getBoundingClientRect();

    if (containerX < window.innerWidth / 2) {
      return "left";
    }

    return "right";
  };

  useClickOutside(dropdownContainerRef, () => setDropdownSide(null));

  useEffect(() => {
    const listener = () => {
      if (dropdownSide === null) return;

      setDropdownSide(calculateDropdownSide());
    };

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return (
    <S.CategoriesGrid rows={rows} columns={columns}>
      {topLevelCategories.map((category, index) => {
        if (!category.is_visible) return;
        return (
          <S.CategoryItem
            data-testid="category-item"
            onClick={() => onClick(category)}
            key={index}
            fillRow={fillRow === category.name}>
            <S.CategoryImage src={category.image} alt={category.name} />
            <S.Text>{category.name}</S.Text>
          </S.CategoryItem>
        );
      })}

      {dropdownCategories.length > 0 && (
        <S.DropdownContainer ref={dropdownContainerRef}>
          <S.DropdownButton
            onClick={() => {
              setDropdownSide((prev) =>
                prev !== null ? null : calculateDropdownSide()
              );
            }}>
            {t("dropshipping.all_categories")}
            <SVG icon={faAngleDown} />
          </S.DropdownButton>

          {dropdownSide !== null && (
            <S.DropdownContent side={dropdownSide}>
              {dropdownCategories.map((category) => (
                <S.DropdownItem
                  key={category.id}
                  onClick={() => {
                    onClick(category);
                    setDropdownSide(null);
                  }}>
                  {category.name}
                </S.DropdownItem>
              ))}
            </S.DropdownContent>
          )}
        </S.DropdownContainer>
      )}
    </S.CategoriesGrid>
  );
};

export default Categories;
