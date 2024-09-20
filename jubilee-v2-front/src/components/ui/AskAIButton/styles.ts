import styled from "styled-components";
import { getColor, getShadow, getSize, responsive } from "~/helpers/style";

export const ButtonStyled = styled.button`
  transition: all 0.25s;
  font-weight: 500;
  font-size: ${getSize(1.5)};
  line-height: ${getSize(2.0)};
  color: ${getColor("text")};
  background: #ffcd29;
  border-radius: 6px;
  padding: ${getSize(1.0)} ${getSize(1.2)};
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  box-shadow: ${getShadow()};

  ${responsive("laptop")} {
    right: 98%;
    left: auto;
    bottom: 35%;
  }

  &:hover {
    filter: brightness(95%);
  }

  &:active {
    filter: brightness(85%);
  }
`;

export const AIText = styled.span`
  color: ${getColor("text")};
  font-size: ${getSize(1.5)};
  font-weight: 500;
`;
