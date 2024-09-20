import styled from "styled-components";
import { getColor, getSize, getProperty } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

interface ITabProps extends UIFlexProps {
  margin?: string;
  hide?: boolean;
}

export const TabContainer = styled.div<ITabProps>`
  display: ${({ hide }) => (hide ? "none" : "flex")};
  flex-direction: ${getProperty("flexDirection", "row")};
  width: 100%;
  overflow-x: auto;
  gap: ${getSize(2.4)};
  background-color: ${({ bgColor }) => bgColor};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  margin: ${({ margin }) => margin || `${getSize(2.0)} 0 0 0`};
  border-radius: ${({ radius }) => radius};
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
  padding: 8px 10px;

  :hover {
    opacity: 0.7;
  }

  &.active {
    font-weight: 500;
    color: ${getColor("primary")};
    border-bottom: 2px solid ${getColor("primary")};

    svg {
      color: ${getColor("primary")};
    }
  }
`;

export const NewBadge = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 17px;
  border-radius: 40px;
  background-color: #db5f7a1a;
  padding: 0 11px;
  height: 20px;
`;

export const NewBadgeText = styled.p`
  font-family: "Inter Variable";
  font-style: normal;
  font-weight: 800;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 0.0015em;
  color: #db5f7a;
  border-radius: 52px;

  text-decoration: none;
`;
