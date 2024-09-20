import styled from "styled-components";
import { getColor } from "~/helpers/style";

export const ToggleContainer = styled.div`
  display: inline-block;
  cursor: pointer;
  user-select: none;
`;

export const ToggleButton = styled.button<{ isOn: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background-color: ${({ isOn }) =>
    isOn ? getColor("primary") : getColor("disabled")};
  transition: background-color 0.3s ease;
  padding: 2px;
  border: none;
  outline: none;
  cursor: pointer;
`;

export const ToggleHandle = styled.div<{ isOn: boolean }>`
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${({ isOn }) =>
    isOn ? getColor("white") : getColor("primary")};
  transition: transform 0.3s ease;
  transform: translateX(${(props) => (props.isOn ? "123%" : "0%")});
`;
