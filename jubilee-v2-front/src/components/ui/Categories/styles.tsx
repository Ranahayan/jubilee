import styled, { css } from "styled-components";
import { getColor, getShadow, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";
import Button from "../Button";

interface ICategoryItem extends UIProps {
  fillRow?: boolean;
}

export const CategoryItem = styled.div<ICategoryItem>`
  display: flex;
  background-color: ${getColor("white")};
  border-radius: ${getSize(1.2)};
  align-items: center;
  position: relative;
  overflow: hidden;
  grid-row: ${({ fillRow }) => (fillRow ? "1 / -1" : "")};
  height: 100%;
  cursor: pointer;
  transition: 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  flex-grow: 1;
  height: ${getSize(6.0)};
  max-height: ${getSize(16.4)};

  img {
    max-width: ${getSize(12.2)};
    object-fit: cover;
  }

  ${responsive("laptopL")} {
    height: ${({ fillRow }) => (fillRow ? "100%" : getSize(6.0))};

    img {
      height: ${({ fillRow }) => (fillRow ? "100%" : "auto")};
      width: ${({ fillRow }) => (fillRow ? "auto" : "")};
    }
  }

  &:hover {
    box-shadow: ${getShadow("md")};
  }
`;

export const Text = styled.p`
  margin: 0 ${getSize(0.8)};
  font-size: ${getSize(1.6)};
  color: ${getColor("black")};
  font-weight: 500;
  width: fit-content;
`;

export const CategoryImage = styled.img`
  width: ${getSize(7.6)};
  height: ${getSize(7.6)};
`;

interface ICategoriesGrid extends UIProps {
  rows: number;
  columns: number;
}

export const CategoriesGrid = styled.div<ICategoriesGrid>`
  display: flex;
  flex-wrap: wrap;
  grid-gap: ${getSize(1.2)};
  grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  grid-template-rows: ${({ rows }) => `repeat(${rows}, 1fr)`};
  align-items: center;
  margin: ${getSize(1.4)} 0;

  ${responsive("laptopL")} {
    display: grid;
  }
`;

export const DropdownButton = styled(Button)`
  display: flex;
  background-color: ${getColor("white")};
  border-radius: ${getSize(0.6)};
  align-items: center;
  height: 100%;
  width: 100%;
  flex-grow: 1;
  height: ${getSize(7.6)};
  max-height: ${getSize(16.4)};
  font-weight: 400;
  font-size: ${getSize(1.4)};
  padding: ${getSize(1.0)} ${getSize(1.1)} ${getSize(1.0)} ${getSize(1.7)};

  & > div {
    gap: ${getSize(2.9)};
    justify-content: space-between;
  }
`;

export const DropdownContainer = styled.div`
  position: relative;
  isolation: isolate;
  z-index: 10;
  flex-grow: 1;
`;

interface IDropdownContent extends UIProps {
  side: "left" | "right";
}

export const DropdownContent = styled.div<IDropdownContent>`
  position: absolute;
  ${({ side }) => css`
    ${side}: 0;
  `}
  top: calc(100% + 4px);
  max-height: ${getSize(20.0)};
  overflow-y: auto;

  align-items: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: ${getSize(0.4)};

  border-radius: ${getSize(0.8)};
  border: 1px solid #f2f4f7;
  box-shadow:
    0px 4px 6px -2px #10182808,
    0px 12px 16px -4px #10182814;
  background-color: ${getColor("backgroundSecondary")};

  ${responsive("tablet")} {
    width: max-content;
    grid-template-columns: minmax(50%, max-content) minmax(50%, max-content);
  }
`;

export const DropdownItem = styled(Button)`
  min-width: ${getSize(18.0)};

  padding: ${getSize(1.0)} ${getSize(1.4)};
  font-size: ${getSize(1.4)};
  font-weight: 500;
  line-height: ${getSize(2.0)};

  & > div {
    justify-content: flex-start;
  }
`;
