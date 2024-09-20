import { getColor, getSize, responsive } from "~/helpers/style";
import FlexContainer from "../FlexContainer";
import styled from "styled-components";

export const ItemContainer = styled(FlexContainer)`
  padding: ${getSize(0.6)} ${getSize(2.0)};
  border: 1px solid ${getColor("border")};
  border-radius: ${getSize(0.6)};
  justify-content: flex-start;
  width: ${getSize(31.0)};

  ${responsive("tablet")} {
    width: ${getSize(50.0)};
  }

  ${responsive("laptop")} {
    width: ${getSize(72.0)};
  }
`;

export const Image = styled.img`
  height: ${getSize(4.0)};
`;

export const ClickableFlex = styled.div`
  margin-left: auto;
  display: flex;
  gap: ${getSize(1.0)};
  cursor: pointer;
`;

export const Synced = styled.div`
  display: flex;
  margin-left: auto;
  gap: ${getSize(1.0)};
`;
