import styled, { css } from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IStyledTable extends UIProps {
  fontSize: string;
  headerBg?: string;
}

export const StyledTable = styled.table<IStyledTable>`
  width: 600px;
  border-collapse: collapse;

  ${responsive("tablet")} {
    width: 100%;
  }

  th {
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    line-height: 16px;
    padding: ${getSize(1.6)};
    color: ${getColor("secondary")};
    ${({ headerBg }) =>
      headerBg &&
      css`
        background-color: ${getColor(headerBg)};
      `}
  }

  button {
    font-weight: 500;
  }

  & tbody > tr {
    border-top: 1px solid ${getColor("borderSecondary")};

    & > td {
      font-size: ${({ fontSize }) => fontSize};
      padding: ${getSize(1.6)};
    }
  }
`;

interface IContainer extends UIProps {
  padding?: string;
}

export const Container = styled.div<IContainer>`
  width: 100%;
  background: white;
  padding: ${({ padding }) => padding};
  border-radius: ${getSize(0.8)};
  overflow-x: auto;
`;
