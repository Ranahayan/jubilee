import styled, { css } from "styled-components";
import { getColor, getShadow, getSize, responsive } from "~/helpers/style";
import Button from "~/components/ui/Button";
import { UIProps } from "~/types/style";

interface ItrashButton extends UIProps {
  isLoading?: boolean;
}

export const ItemContainer = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  padding: ${getSize(2.0)};
  box-shadow: ${getShadow()};
  border-radius: ${getSize(0.6)};
  justify-content: space-between;
  background-color: ${getColor("white")};
  align-items: center;
  width: 100%;
  border: 1px solid ${getColor("border")};
`;

export const Image = styled.img`
  height: ${getSize(4.0)};
`;

export const ClickableFlex = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  cursor: pointer;
`;

export const TrashButton = styled(Button)<ItrashButton>`
  border: 1px solid ${getColor("border")};
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ isLoading }) =>
    isLoading
      ? css`
          width: ${getSize(4.1)};
          height: ${getSize(4.1)};
          padding: ${getSize(0.8)};
          border-radius: 100%;
        `
      : null}
`;

export const HideOnSmallDevice = styled.span`
  display: none;

  ${responsive("laptop")} {
    display: block;
  }
`;
