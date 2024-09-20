import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IGridBox extends UIProps {
  columnCount: number;
}

interface IRadioButton extends UIProps {
  disabled?: boolean;
}

export const RadioButtonContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export const HiddenRadioButton = styled.input.attrs({ type: "radio" })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

export const StyledRadioButton = styled.div<IRadioButton>`
  display: inline-flex;
  width: 16px;
  height: 16px;
  border: 1px solid ${getColor("border")};
  transition: border 0.2s;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  margin-right: 5px;

  &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) =>
      props.disabled ? getColor("border") : props.color || getColor("primary")};
    opacity: 0;
    transition: opacity 0.2s;
  }

  ${HiddenRadioButton}:checked + &::after {
    opacity: 1;
  }
  ${HiddenRadioButton}:checked + & {
    border: 1px solid
      ${(props) =>
        props.disabled
          ? getColor("border")
          : props.color || getColor("primary")};
  }
`;

export const BoxContainer = styled.div<IRadioButton>`
  display: flex;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  height: auto;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: auto;
  border-radius: ${getSize(0.4)};
  gap: ${getSize(0.4)};
  color: ${getColor("textSecondary")};
  padding: ${getSize(1.0)} 0;
  font-size: ${getSize(1.4)};
  border: 1px solid ${getColor("borderSecondary")};
  transition: 1s;

  &.active {
    border: 1px solid ${getColor("primary")};
  }

  div {
    margin: 0;
  }
`;

//@ts-ignore
export const GridBox = styled.div<IGridBox>`
  display: grid;
  grid-template-columns: ${(props) => `repeat(${props.columnCount}, 1fr)`};
  grid-gap: 10px;
`;
