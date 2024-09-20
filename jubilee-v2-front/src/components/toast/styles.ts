import styled from "styled-components";
import { ToastContainer as ToastifyContainer } from "react-toastify";
import { getBorderRadius, getColor, getSize } from "~/helpers/style";
import { SVG } from "~/components/ui/SVG";
import Button from "~/components/ui/Button";
import { ToastType } from "./types";
import { IThemeColors } from "~/types/theme";
import { UIProps } from "~/types/style";

interface IColoredComponentItem {
  background: keyof IThemeColors;
  foreground: keyof IThemeColors;
}

const colors = {
  info: {
    background: "infoLight",
    foreground: "infoDark",
  },
  success: {
    background: "successLight",
    foreground: "successDark",
  },
  warning: {
    background: "warningLight",
    foreground: "warningDark",
  },
  error: {
    background: "errorLight",
    foreground: "errorDark",
  },
} satisfies Record<ToastType, IColoredComponentItem>;

interface IColoredComponent extends UIProps {
  type: ToastType;
}

const getTypeColor =
  (color: keyof IColoredComponentItem) =>
  ({ type }: { type: ToastType }) =>
    getColor(colors[type][color]);

export const ToastContainer = styled(ToastifyContainer)`
  .Toastify__toast {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    padding: 0;
    box-shadow: 0px 14px 42px 0px #081f4029;
    min-height: 0;
    min-width: 0;

    border-radius: ${getBorderRadius(1.5)};

    margin: ${getSize(1.2)};

    @media (min-width: 481px) {
      margin: 0 0 ${getSize(1.6)} 0;
    }
  }

  .Toastify__toast-body {
    padding: 0;
    margin: 0;
  }
`;

export const Header = styled.div<IColoredComponent>`
  display: flex;
  align-items: center;

  gap: ${getSize(0.6)};
  padding: 0 0 0 ${getSize(1.5)};

  background-color: ${getTypeColor("background")};
`;

export const Title = styled.span<IColoredComponent>`
  font-weight: 500;
  font-size: ${getSize(1.3)};
  line-height: ${getSize(2.5)};
  color: ${getTypeColor("foreground")};

  margin-right: auto;
`;

export const HeaderIcon = styled(SVG)<IColoredComponent>`
  color: ${getTypeColor("foreground")};
`;
export const CloseButton = styled(Button)<IColoredComponent>`
  background-color: ${getTypeColor("background")};
  padding: ${getSize(0.6)} ${getSize(1.5)};
  border-radius: 0;
`;

export const Body = styled.div`
  padding: ${getSize(1.5)} ${getSize(2.5)};
  font-weight: 500;
  font-size: ${getSize(1.3)};
  line-height: ${getSize(2.4)};
`;

export const InlineAction = styled.button`
  border: 0;
  padding: 0;
  background: none;
  text-decoration: underline;
  color: ${getColor("primary")};
  cursor: pointer;

  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;
