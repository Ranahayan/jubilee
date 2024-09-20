import styled from "styled-components";
import { sidebarWidth } from "~/components/layout/Sidebar.style";
import { getColor, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const LoaderContainer = styled.div<{ fullWidth?: boolean } & UIProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  width: auto;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;

  ${responsive("tablet")} {
    transform: ${({ fullWidth }) =>
      fullWidth
        ? "translate(-50%, -50%)"
        : `translate(calc(-50% + ${sidebarWidth / 2}px), -50%)`};
  }

  circle {
    stroke: ${getColor("primary")};
  }
`;
