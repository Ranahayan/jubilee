import styled from "styled-components";
import { getSize, responsive } from "~/helpers/style";

export const LEFT_SIDE_WIDTH = 280;

export const SettingsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  flex-direction: column;

  ${responsive("laptop")} {
    flex-direction: row;
  }
`;

export const RightSide = styled.div`
  display: flex;
  width: 100%;
  margin: ${getSize(2.8)} 0;
  justify-content: flex-start;
  align-items: flex-start;

  ${responsive("laptop")} {
    width: 50%;
    flex-direction: row;
    margin: 0;
  }
`;

export const LeftSide = styled.div`
  display: flex;
  max-width: ${LEFT_SIDE_WIDTH}px;
  width: auto;

  ${responsive("laptop")} {
    width: 50%;
  }
`;
