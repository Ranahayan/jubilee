import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const CheckboxWrapper = styled.label`
  display: inline-block;
  position: relative;
  cursor: pointer;
  &.disabled {
    cursor: not-allowed;
  }
  user-select: none;
  padding-left: ${getSize(1.6)};
  height: ${getSize(1.6)};
  line-height: ${getSize(1.6)};
`;

export const Checkmark = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: ${getSize(1.6)};
  height: ${getSize(1.6)};
  border: 1px solid ${getColor("textSecondary")};
  border-radius: 3px;
  background-color: transparent;
`;

export const CheckmarkTick = styled.span`
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
`;

export const CheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;

  &:checked + ${Checkmark} {
    background-color: ${
      //@ts-ignore
      getColor("primary")
    };
  }

  &:checked + ${Checkmark} ${CheckmarkTick} {
    display: block;
  }
`;

export const CheckboxLabel = styled.span`
  font-weight: 400;
  font-size: 15px;
  line-height: 130%;
  color: ${getColor("text")};
`;
