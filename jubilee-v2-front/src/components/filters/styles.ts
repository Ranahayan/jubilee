import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const DropdownContainer = styled.div`
  position: relative;
  isolation: isolate;
  z-index: 9;
  margin-left: auto;
`;

export const FilterButton = styled(Button)`
  margin-left: auto;
  display: block;

  border-radius: ${getSize(0.6)};
  font-weight: 500;
  font-size: ${getSize(1.4)};
  padding: ${getSize(1.3)} ${getSize(1.6)};

  & > div {
    gap: ${getSize(1.0)};
    justify-content: space-between;

    & > :last-child {
      opacity: 0.5;
      margin-left: ${getSize(.3)};
    }
  }
`;

export const DropdownContent = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  max-height: ${getSize(20.0)};
  overflow-y: auto;

  align-items: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  border-radius: ${getSize(0.8)};
  border: 1px solid #f2f4f7;
  box-shadow:
    0px 4px 6px -2px #10182808,
    0px 12px 16px -4px #10182814;
  background-color: ${getColor("backgroundSecondary")};
`;

interface DropdownItem extends UIProps {
  selected: boolean;
}

export const DropdownItem = styled.button<DropdownItem>`
  text-align: left;
  border: 0;
  cursor: pointer;
  background-color: ${({ selected }) =>
    getColor(selected ? "primaryLight" : "background")}90;
  padding: ${getSize(1.0)} ${getSize(1.4)};
  min-width: ${getSize(23.0)};

  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: ${getColor("primaryLight")}90;
  }
`;
