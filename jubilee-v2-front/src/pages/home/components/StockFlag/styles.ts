import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const StockFlag = styled.div`
  position: absolute;
  z-index: 2;
  top: ${getSize(0.6)};
  right: ${getSize(0.6)};
  border-radius: ${getSize(3.5)};
  font-size: ${getSize(1.0)};
  gap: ${getSize(0.4)};
  display: flex;
  align-items: center;
  font-weight: 500;
  justify-content: center;
  padding: 0 ${getSize(1.0)};

  &.out-of-stock {
    background-color: ${getColor("redSecondary")};
    color: ${getColor("red")};

    .svg {
      color: ${getColor("red")};
    }
  }

  &.in-stock {
    background-color: ${getColor("greenSecondary")};
    color: ${getColor("green")};

    .svg {
      color: ${getColor("green")};
    }
  }
`;
