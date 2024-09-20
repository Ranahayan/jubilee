import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const DropdownContainer = styled.div`
  min-width: ${getSize(11.8)};
  min-height: ${getSize(10.1)};
  background-color: ${getColor("white")};
  border-radius: ${getSize(0.6)};
  overflow: hidden;
`;

export const DropdownItem = styled.button`
  outline: none;
  border: none;
  display: flex;
  gap: ${getSize(1.0)};
  padding: ${getSize(1.0)};
  color: ${getColor("text")};
  background-color: ${getColor("white")};
  width: 100%;
  cursor: pointer;

  &:hover {
    background-color: ${getColor("primaryLight")};
  }
`;

export const Text = styled.span`
  font-size: ${getSize(1.2)};
  color: ${getColor("text")};
`;
