import styled from "styled-components";
import Button from "~/components/ui/Button";
import {
  getBorderRadius,
  getColor,
  getFadeInAnimation,
  getSize,
  responsive,
} from "~/helpers/style";

export const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2;
  ${getFadeInAnimation(0.3)}
`;

export const ModalContent = styled.div`
  position: fixed;
  background: white;
  height: auto;
  border-radius: ${getBorderRadius(1.2)};
  width: 100%;
  max-height: 95%;
  overflow: auto;
  padding: ${getSize(3.2)};

  @media (min-width: 1441px) {
    max-width: 1440px;
    top: 50%;
    bottom: auto;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    padding: ${getSize(5.2)} ${getSize(4.0)};
  }

  @media (max-width: 1440px) {
    width: auto;
    top: 50%;
    bottom: auto;
    transform: translateY(-50%);
    left: ${getSize(8.0)};
    right: ${getSize(8.0)};
    padding: ${getSize(1.8)} ${getSize(1.9)};
  }

  @media (max-width: 460px) {
    width: auto;
    top: ${getSize(3.0)};
    bottom: ${getSize(3.0)};
    left: ${getSize(2.0)};
    right: ${getSize(2.0)};
    transform: none;
    padding: ${getSize(1.8)} ${getSize(1.9)};
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
