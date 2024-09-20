import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

export const SortBy = styled.div<UIFlexProps>`
  align-self: ${({ alignSelf }) => alignSelf || "flex-end"};
  background-color: ${getColor("white")};
  border-radius: ${getSize(0.6)};
  padding: ${getSize(1.0)} ${getSize(2.4)};
  font-size: ${getSize(1.6)};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    cursor: pointer;
    color: ${getColor("black300")};

    &:hover {
      color: ${getColor("primary")};
    }
  }

  span {
    font-weight: 500;
  }

  & .react-select__control {
    border-color: transparent;
    box-shadow: none;
  }

  & .react-select__control:hover {
    border-color: transparent;
  }

  & .react-select__indicator-separator {
    display: none;
  }
`;
