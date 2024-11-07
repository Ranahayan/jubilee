import styled from "styled-components";
import { getColor, getColorWithAlpha, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface IStyledTable extends UIProps {
  fontSize: string;
}

export const StyledTable = styled.table<IStyledTable>`
  width: 600px;
  border-collapse: collapse;
  margin-top: ${getSize(1.4)};

  ${responsive("tablet")} {
    width: 100%;
  }

  th {
    text-align: center;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    padding: ${getSize(0.6)} ${getSize(0.8)};
    color: ${getColor("text")};
    background-color: ${getColorWithAlpha("text", 0.05)};
    white-space: nowrap;

    &:nth-child(2) {
      text-align: left;
    }
  }

  button {
    font-weight: 500;
  }

  & tbody > tr {
    border-top: 1px solid ${getColor("borderSecondary")};

    & > td {
      font-size: ${({ fontSize }) => fontSize};
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
  overflow-x: auto;
`;
