import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const StepTitle = styled.h2`
  color: ${getColor("text")};
  font-size: ${getSize(1.6)};
  font-weight: 600;
  margin: 0;

  ${responsive("tablet")} {
    margin: ${getSize(1.3)} 0;
  };
`;

export const CardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  gap: ${getSize(2.0)};

  ${responsive("tablet")} {
    grid-template-columns: 1fr 1fr;
  };
`;

export const CardCategory = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  padding: ${getSize(1.2)} ${getSize(2.3)};
  border: 1px solid ${getColor("border")};
  border-radius: ${getSize(0.8)};
  font-size: ${getSize(1.4)};
  color: ${getColor("text")};
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
  transition: border-color 0.4s;

  ${responsive("tablet")} {
    font-size: ${getSize(1.6)};
    padding: ${getSize(1.8)} ${getSize(2.3)};
  };

  &:hover {
    background-color: ${getColor("background")};
  }

  &.active {
    border-color: ${getColor("primary")};
  }
`;

export const ButtonFixedContainer = styled.div`
  padding: ${getSize(1.3)};
  background-color: ${getColor("background")};
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
