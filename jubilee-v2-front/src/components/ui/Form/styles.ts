import styled from "styled-components";
import { getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IGridItem extends UIProps {
  cols?: number;
  noInnerMargin?: boolean;
}

export const Grid = styled.div<{ noMargin: boolean } & UIProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ noMargin, ...rest }) =>
    noMargin ? "0" : getSize(2)(rest)};

  ${responsive("laptop")} {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-gap: ${getSize(1)};
  }
`;

export const GridItem = styled.div<IGridItem>`
  grid-column: span ${({ cols = 12 }) => cols};
  margin-bottom: ${({ noInnerMargin }) => getSize(noInnerMargin ? 0 : 1)};
`;

export const FieldWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const PasswordToggle = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray600};
  z-index: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: ${({ theme }) => theme.colors.gray800};
  }
`;