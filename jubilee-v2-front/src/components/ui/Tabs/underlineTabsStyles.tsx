import styled from "styled-components";
import { getColor, getSize, getProperty } from "~/helpers/style";

export const TabContainer = styled.div`
  display: flex;
  flex-direction: ${getProperty("flexDirection", "row")};
  width: 100%;
  gap: ${getSize(2.4)};
  margin-bottom: ${getSize(2.0)};
  border-bottom: 1px solid ${getColor("borderSecondary")};
`;

export const Tab = styled.div`
  display: flex;
  width: fit-content;
  align-items: center;
  gap: ${getSize(1.0)};
  color: ${getColor("textSecondary")};
  cursor: pointer;
  text-decoration: none !important;
  font-size: ${getSize(1.6)};
  line-height: 178.1%;
  letter-spacing: 0.62px;
  padding: 8px 2px;

  :hover {
    opacity: 0.7;
  }

  &.active {
    font-weight: 500;
    color: ${getColor("text")};
    border-bottom: 2px solid ${getColor("primary")};

    svg {
      color: ${getColor("primary")};
    }
  }
`;
