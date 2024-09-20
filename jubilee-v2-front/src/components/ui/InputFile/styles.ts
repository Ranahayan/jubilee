import styled from "styled-components";
import { getBorderRadius, getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface InputFileWrapperProps extends UIProps {
  isDisabled?: boolean;
}

export const InputFileWrapper = styled.div<InputFileWrapperProps>`
  width: 100%;
  padding: ${getSize(0.8)} ${getSize(1.6)};
  background-color: ${getColor("background")};
  color: ${getColor("textSecondary")};
  display: flex;
  border: 2px dashed ${getColor("border")};
  border-radius: ${getBorderRadius(0.6)};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  opacity: ${({ isDisabled }) => (isDisabled ? 0.5 : 1)};
`;

export const BrowseAnchor = styled.a`
  color: ${getColor("primary")};
  cursor: pointer;
  text-decoration: underline;
  margin-left: -5px;
`;

export const ActionsWrapper = styled.div<UIProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${getSize(0.6)};
`;

interface ActionButtonProps extends UIProps {
  isSecondary?: boolean;
}

export const ActionButton = styled.button<ActionButtonProps>`
  padding: 0 ${getSize(1.6)};
  height: ${getSize(4.2)};
  border-radius: ${getBorderRadius(0.6)};
  border: none;
  background-color: ${({ isSecondary }) =>
    isSecondary ? getColor("textSecondary") : getColor("primary")};
  color: ${getColor("white")};
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${getSize(0.8)};

  &:hover {
    opacity: 0.8;
  }
`;

export const Loader = styled.div<UIProps>`
  svg {
    width: ${getSize(3.0)};
    height: ${getSize(4.2)};

    * {
      stroke: ${getColor("primary")};
    }
  }
`;

export const FileInfo = styled.div<UIProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${getSize(0.8)};
  font-size: ${getSize(1.4)};
  color: ${getColor("text")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const InputShadow = styled.input`
  display: none;
`;
