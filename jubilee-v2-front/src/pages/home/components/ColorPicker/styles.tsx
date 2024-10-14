import styled from "styled-components";
import { getSize, getColor } from "~/helpers/style";
import { HexColorPicker } from "react-colorful";

export const ColorPickerWrapper = styled.div`
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: ${getColor('white')};
  padding: ${getSize(1.6)};
  border: 1px solid ${getColor('border')};
  border-radius: ${getSize(0.6)};
  z-index: 10;
  width: 100%;

  input {
    width: 100%;
    padding: ${getSize(1.0)};
    border: 1px solid ${getColor('border')};
    border-radius: ${getSize(0.6)};
  }
`

export const ColorPicker = styled(HexColorPicker)`
  .react-colorful& {
    width: 100%;
    height: 150px;
    margin-bottom: ${getSize(1.6)};
  }
`;

export const ColorPickerActions = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${getSize(1.0)};
  margin-top: ${getSize(1.6)};
`;

export const ActionButton = styled.button`
  display: flex;
  flex: 1;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  padding: ${getSize(1.0)} ${getSize(1.6)};
  color: ${getColor('secondary')};
  font-weight: 500;
  font-size: ${getSize(1.6)};
  cursor: pointer;
  border: 1px solid ${getColor('border')};
  border-radius: ${getSize(0.6)};
  background: ${getColor('white')};
  gap: ${getSize(1.0)};

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  &:last-child {
    background: ${getColor('primary')};
    color: ${getColor('white')};
    border-color: ${getColor('primary')};

    &:hover {
      opacity: 0.9;
    }
  }
`