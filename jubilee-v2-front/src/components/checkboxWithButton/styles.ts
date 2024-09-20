import styled from "styled-components";
import { getColor, getColorWithAlpha, getSize } from "~/helpers/style";


export const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${getColor("white")};
  width: fit-content;
  padding: ${getSize(0.4)} ${getSize(0.5)};
  border-radius: ${getSize(0.4)};
  gap: ${getSize(1.6)};
`;

export const Checkbox = styled.div`
  margin-right: ${getSize(1.0)};
  font-size: ${getSize(1.4)};
  display: flex;
  align-items: center;
  font-weight: 500;

  input {
    margin-left: ${getSize(1.4)};
    margin-right: ${getSize(0.8)};
    cursor: pointer;
  }
`;

export const Button = styled.button`
  background-color: ${getColorWithAlpha("primary", 0.1)};
  color: ${getColor("primary")};
  border: none;
  border-radius: ${getSize(0.6)};
  padding: ${getSize(0.8)} ${getSize(1.4)};
  cursor: pointer;
  font-weight: 500;

  &:hover:not(:disabled) {
    background-color: ${getColorWithAlpha("primary", 0.2)};
  }

  &:disabled {
    opacity: 0.9;
  }
`;