import styled from "styled-components";
import { getBorderRadius, getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

const INPUT_BORDER_RADIUS = 0.6;

const fontStyle = `
  font-size: 15px;
  line-height: 180%;
`;

interface IInputWrapper extends UIProps {}

export const InputWrapper = styled.div<IInputWrapper>`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  width: 100%;
  border-radius: ${getBorderRadius(INPUT_BORDER_RADIUS)};
  transition: border 0.1s ease-in-out;
  border: 1px solid ${({ color }) => getColor(color)}};

  &.color-picker {
    width: auto;
    border-radius: 25px;
  }

  &.disable-highlight {
    border: none;
  }

  &.error {
    border: 1px solid ${getColor("error")};
  }

  &.disabled {
    background-color: ${getColor("background")};
    & input {
      background-color: ${getColor("background")};
    }
  }

  &:focus-within:not(.disable-highlight) {
    border: 1px solid ${getColor("primary")};
    outline: 1px solid ${getColor("primary")};
  }

  & input::placeholder,
  & .react-select__placeholder {
    color: ${getColor("textSecondary")};
    ${fontStyle}
  }

  & input {
    border-radius: ${getBorderRadius(INPUT_BORDER_RADIUS)};
    width: 100%;
    padding: ${getSize(0.6)} ${getSize(1)};
    color: ${getColor("text")};
    border: none;
    ${fontStyle}

    &:focus {
      outline: none;
    }
  }

  // react-select styles
  &:not(.disable-highlight) > div {
    width: 100%;
  }

  & .react-select__control {
    width: 100%;
    border: none;
  }

  & .react-select__multi-value__label {
    ${fontStyle}
    padding: 0 ${getSize(0.6)};
    background-color: ${getColor("background")};
  }

  & .react-select__multi-value__remove {
    background-color: ${getColor("background")};
  }

  & .react-select__single-value {
    ${fontStyle}
    color: ${getColor("text")};
  }

  & .react-select__option {
    ${fontStyle}

    &:active, &:hover, &--is-focused, &--is-selected {
      ${fontStyle}
      background-color: ${getColor("background")};
    }
    &--is-selected {
      color: ${getColor("primary")};
      ${fontStyle}
    }
  }
`;

export const Prefix = styled.span`
  color: ${getColor("textSecondary")};
  height: 100%;
  padding: 0 ${getSize(1)};
  border-right: 1px solid ${getColor("borderSecondary")};

  & + input {
    padding-left: ${getSize(0.8)};
  }
`;

export const TextArea = styled.textarea`
  transition: border 0.1s ease-in-out;
  padding: ${getSize(0.6)} ${getSize(1.2)};
  width: 100%;
  border-radius: ${getBorderRadius(INPUT_BORDER_RADIUS)};
  border: 0;
  resize: none;
  ${fontStyle}

  &:focus {
    outline: none;
  }
`;

export const Error = styled.span`
  color: ${getColor("error")};
  font-size: 12px;
  line-height: 200%;
  bottom: ${getSize(-2.2)};
  left: 0;
  position: absolute;
`;
