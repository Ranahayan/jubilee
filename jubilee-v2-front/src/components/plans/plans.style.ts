import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const PageTitle = styled.h1`
  font-weight: 700;
  font-size: ${getSize(2.4)};
  line-height: ${getSize(2.4)};
  text-align: center;
`;

interface IPlansGrid extends UIProps {
  gap: number;
}

export const PlansGrid = styled.div<IPlansGrid>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ gap }) => getSize(gap)};
  margin: ${getSize(3.5)} auto ${getSize(2)} auto;
  justify-content: center;
  align-items: stretch;
  width: 100%;
`;

export const ToggleContentText = styled.p`
  margin: 0;
  font-size: ${getSize(1.3)};
  font-weight: 500;
  line-height: ${getSize(2.0)};
  color: ${getColor("textDisabled")};

  &.selected {
    font-weight: 500;
    color: ${getColor("text")};
  }
`;

export const PromotionText = styled.div`
  position: relative;
  background-color: ${getColor("greenSecondary")};
  color: ${getColor("green")};
  margin: 0;
  padding: ${getSize(0.2)};
  padding: ${getSize(0.2)} ${getSize(1)};
  border-radius: ${getSize(0.5)};
  font-size: ${getSize(1.2)};
  font-weight: 500;
  line-height: ${getSize(1.83)};
`;

export const DowngradeNoteWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin: ${getSize(2)} auto;
`;

export const DowngradeNote = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(1.0)};
  background-color: #FFC107;
  color: #000000;
  padding: ${getSize(1.2)} ${getSize(2.0)};
  border-radius: ${getSize(0.6)};
  max-width: fit-content;
`;

export const DowngradeNoteText = styled.span`
  font-size: ${getSize(1.5)};
  font-weight: 500;
  line-height: ${getSize(2.0)};
  color: #000000;
`;