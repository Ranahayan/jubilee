import styled from "styled-components";
import { Breadcrumbs } from "~/components/breadcrumbs";
import { Filters } from "~/components/filters";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const ProductsContainer = styled.div`
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: ${getSize(2.4)};
  margin-top: ${getSize(2.0)};

  ${responsive("desktop")} {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  ${responsive("tablet")} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ProductsContainerSkeleton = styled.div`
  .skeleton-container {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    grid-gap: ${getSize(2.4)};
    margin-top: ${getSize(2.0)};

    ${responsive("desktop")} {
      grid-template-columns: repeat(4, 1fr) !important;
    }

    ${responsive("tablet")} {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .skeleton {
    border-radius: ${getSize(0.6)};
    height: ${getSize(36.0)};
    width: 100%;
  }
`;

export const FlexContainerRelative = styled(FlexContainer)`
  position: relative;
`;

export const AbsoluteIcon = styled.div`
  position: absolute;
  left: ${getSize(1.6)};

  div {
    width: auto !important;
    height: 26px !important; 
  }
`;

export const ImageSearchButton = styled(Button)`
  position: absolute;
  right: ${getSize(0.6)};
  align-self: center;
`;

export const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 0 ${getSize(2.0)} 0;
  gap: ${getSize(1.0)};
  flex-wrap: wrap;
`;

export const Filter = styled.button`
  min-height: ${getSize(4.5)};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${getSize(1.4)} ${getSize(1.2)};
  color: ${getColor("text")};
  font-weight: 500;
  font-size: ${getSize(1.4)};
  cursor: pointer;
  border: none;
  border-radius: ${getSize(0.6)};
  background: ${getColor("white")};
  gap: ${getSize(1.0)};

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  &.active {
    color: ${getColor("primary")};
    border-color: ${getColor("primary")};
    background: linear-gradient(to bottom, #fff, #ffeff2);
  }
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${getSize(1.8)} 0;
  flex-direction: column;
  gap: ${getSize(1.6)};

  ${responsive("tablet")} {
    flex-direction: row;
  }
`;

export const ColorwheelSelect = styled(Filter)`
  position: relative;
`;

export const StyledBreadcrumbs = styled(Breadcrumbs)`
  margin-top: ${getSize(2.0)};
`;

interface IActiveComponent extends UIProps {
  active: boolean;
}

export const BooleanFilterButton = styled(Button)<IActiveComponent>`
  font-weight: 500;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(1.4)};
  padding: ${getSize(1.4)} ${getSize(1.2)};
  border: solid 1px
    ${({ active }) => (active ? getColor("primary") : "transparent")};
`;

export const StyledFilter = styled(Filters)<IActiveComponent>`
  margin-left: 0;

  & > button {
    font-weight: 500;
    font-size: ${getSize(1.4)};
    line-height: ${getSize(1.4)};
    padding: ${getSize(1.4)} ${getSize(1.2)};
    border: solid 1px
      ${({ active }) => (active ? getColor("primary") : "transparent")};
  }
`;
