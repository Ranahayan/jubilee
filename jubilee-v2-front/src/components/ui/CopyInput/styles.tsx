import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const InputCopyWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const CopyButton = styled.button`
  position: absolute;
  cursor: pointer;
  top: 0;
  right: 0px;
  padding: ${getSize(1.0)} ${getSize(1.4)};
  background-color: ${getColor("primary")};
  border-radius: 0 ${getSize(0.6)} ${getSize(0.6)} 0;
  font-size: ${getSize(1.6)};
  border: none;
  outline: none;

  &:hover {
    opacity: 0.9;
  }
`;
