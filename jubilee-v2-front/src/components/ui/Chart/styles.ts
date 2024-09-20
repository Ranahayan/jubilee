import FlexContainer from "../FlexContainer";
import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";
interface ITooltipColor extends UIFlexProps {
  color: string;
}

export const ChartHeader = styled(FlexContainer)`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid ${getColor("borderSecondary")};
`;

export const HeaderCell = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: ${getSize(1.0)};
  gap: ${getSize(1.2)};
  padding: ${getSize(2.8)} 0;

  label {
    font-size: 16px;
  }

  span {
    font-size: 20px;
    font-weight: 600;
  }
`;

export const Tooltip = styled.div<ITooltipColor>`
  display: flex;
  flex-direction: row;
  color: ${getColor("white")};
  font-size: 14px;
  background-color: ${({ color }) => color};
  border-radius: 25px;
  padding: ${getSize(0.6)} ${getSize(1.5)} ${getSize(0.6)} ${getSize(0.6)};
  justify-content: center;
  align-items: center;
  gap: 0;
`;

export const TooltipIcon = styled.div<ITooltipColor>`
  width: ${getSize(2.6)};
  height: ${getSize(2.6)};
  border-radius: ${getSize(2.0)};
  background-color: ${getColor("white")};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  line-height: 18px;
  color: ${({ color }) => color};
`;

export const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${getSize(1.0)};

  p {
    margin: 0;
    padding: 0;
    line-height: 14px;
    font-weight: bold;
  }

  span {
    margin: ${getSize(0.4)} 0 0 0;
    padding: 0;
    font-size: 10px;
    line-height: 8px;
    opacity: 0.8;
  }
`;
