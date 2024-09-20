import styled from "styled-components";
import {
  getBorderRadius,
  getColor,
  getFadeInAnimation,
  getSize,
  responsive,
} from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IModal extends UIProps {
  padding?: string;
  minWidth: string | number;
  maxHeight?: string;
  maxWidth?: string | number;
}

export const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2;
  // Fade in the modal once added to the DOM
  ${getFadeInAnimation(0.3)}
`;

export const ModalContent = styled.div<IModal>`
  position: fixed;
  background: white;
  min-width: ${({ minWidth }) => minWidth};
  height: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: ${getBorderRadius(1.2)};
  max-height: ${({ maxHeight }) => maxHeight ? maxHeight : "80%"};
  max-width: ${({ maxWidth }) => (maxWidth ? maxWidth : "")};
  overflow: auto;
  padding: ${({ padding }) => (padding ? padding : getSize(3.2))};
  ${responsive("tablet")} {
    padding: ${({ padding }) => (padding ? padding : getSize(5.8))};
  }
`;

export const CloseContainer = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;

  padding: ${getSize(1.2)};
  ${responsive("tablet")} {
    padding: ${getSize(2.4)};
  }
`;

export const FixedElement = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${getColor("background")};
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  z-index: 3;
`;