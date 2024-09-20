import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

interface isBlurred extends UIFlexProps {
  isBlurred: boolean;
  isDisabled?: boolean;
}

export const Overlay = styled.div`
  width: 100%;
  position: relative;
`;

export const Content = styled.div<isBlurred>`
  width: 100%;
  filter: blur(${({ isBlurred }) => (isBlurred ? "1.5px" : "0")});
  opacity: ${({ isDisabled }) => (isDisabled ? 0.5 : 1)};
  pointer-events: ${({ isDisabled }) => (isDisabled ? "none" : "auto")};
`;

export const Message = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  font-size: ${getSize(1.6)};
  background: radial-gradient(${getColor("white")} 20%, transparent);
  gap: ${getSize(1)};

  > p {
    margin: 0;
  }

  > * a {
    color: ${getColor("primary")};
    text-decoration: underline;
  }
`;
