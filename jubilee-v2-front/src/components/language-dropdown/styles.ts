import styled, { css } from "styled-components";
import { getColor, getSize, getColorWithAlpha } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const LanguageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${getSize(1.2)} ${getSize(1.6)};
  background: ${getColor("backgroundSecondary")};
  border: 1px solid ${getColor("borderSecondary")};
  border-radius: ${getSize(0.8)};
  cursor: pointer;
  font-size: ${getSize(1.4)};
  color: ${getColor("text")};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${getColor("primary")};
  }

  & svg {
    width: ${getSize(1.6)};
    height: ${getSize(1.6)};
  }
`;

interface IDropdownContentProps extends UIProps {
  side: "left" | "right";
}

export const DropdownContent = styled.div<IDropdownContentProps>`
  position: absolute;
  top: calc(100% + ${getSize(0.8)});
  ${({ side }) => side === "left" ? css`left: 0;` : css`right: 0;`}
  width: 100%;
  background: ${getColor("backgroundSecondary")};
  border: 1px solid ${getColor("borderSecondary")};
  border-radius: ${getSize(0.8)};
  box-shadow: 0 ${getSize(0.8)} ${getSize(2.4)} ${getColorWithAlpha("text", 0.1)};
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
`;

interface ILanguageDropdownItemProps extends UIProps {
  selected: boolean;
}

export const LanguageDropdownItem = styled.div<ILanguageDropdownItemProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${getSize(1.2)} ${getSize(1.6)};
  cursor: pointer;
  font-size: ${getSize(1.4)};
  color: ${getColor("text")};
  background: ${({ selected }) => selected ? getColorWithAlpha("primary", 0.1) : "transparent"};
  border-left: ${({ selected }) => selected ? `${getSize(0.3)} solid ${getColor("primary")}` : "none"};
  
  &:hover {
    background: ${getColorWithAlpha("primary", 0.05)};
  }

  & svg {
    width: ${getSize(1.6)};
    height: ${getSize(1.6)};
  }
`; 
