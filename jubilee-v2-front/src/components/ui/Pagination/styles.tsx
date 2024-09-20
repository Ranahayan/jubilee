import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: ${getSize(3.2)};
`;

interface NumberStyleProps extends UIProps {
  dots?: boolean;
  active?: boolean;
}

export const NumberStyle = styled.span<NumberStyleProps>`
  font-size: ${getSize(1.6)};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${getSize(0.8)} ${getSize(1.4)};
  border-radius: ${getSize(0.6)};
  font-weight: 500;
  cursor: ${(props) => (props.dots ? "default" : "pointer")};
  color: ${(props) => (props.active ? getColor("white") : getColor("text"))};
  background-color: ${(props) => props.active && getColor("primary")};
  transition: 0.5s;
`;

export const PaginationButton = styled.button`
  height: ${getSize(4.1)};
  width: ${getSize(4.1)};
  background-color: ${getColor("white")};
  border: 1px solid ${getColor("border")};
  box-sizing: border-box;
  border-radius: ${getSize(0.6)};
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease-in-out;
  cursor: pointer;

  &:hover {
    background-color: getColor("border");
    border: solid 1px getColor("border");
  }

  &:disabled {
    border: solid 1px getColor("border");
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:disabled:hover {
    background-color: getColor("white");
    border: solid 1px getColor("border");
    cursor: not-allowed;
  }
`;

export const ButtonArea = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(0.2)};

  ${responsive("tablet")} {
    gap: ${getSize(0.7)};
  }
`;
