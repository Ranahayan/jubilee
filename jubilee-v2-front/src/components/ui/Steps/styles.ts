import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const StepsContainer = styled.div`
  display: flex;
  width: calc(100% - ${getSize(8)});
  max-width: ${getSize(60)};
  position: relative;
  margin-top: ${getSize(1)};
  margin-bottom: ${getSize(6)};
`;

export const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate(-52%, -${getSize(1)});
  position: absolute;
  gap: ${getSize(1.2)};
`;

export const CheckIMG = styled.img`
  width: ${getSize(2.7)};
  height: ${getSize(2.7)};
  background-color: ${getColor("white")};
  border-radius: 50%;
`;

export const StepText = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 158%;
  color: ${getColor("text", "color")};
`;
