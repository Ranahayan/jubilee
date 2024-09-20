import styled from "styled-components";
import { getColor, getSize, getProperty } from "~/helpers/style";
import { StyledLink } from "../Styled/Link";

export const OuterContainer = styled.div`
  background-color: ${getColor("backgroundSecondary")};
  padding: ${getSize(3.2)} ${getSize(3.2)} ${getSize(4.8)};
`;

export const TabContainer = styled.div`
  display: flex;
  flex-direction: ${getProperty("flexDirection", "row")};
  width: 100%;
  gap: ${getSize(2.4)};
  margin-bottom: ${getSize(3.2)};

  border-bottom: ${getSize(0.1)} solid ${getColor("border")};
`;

export const Tab = styled(StyledLink)`
  display: flex;
  width: fit-content;
  align-items: center;
  gap: ${getSize(1.0)};
  color: ${getColor("textSecondary")};
  cursor: pointer;
  text-decoration: none !important;
  transition: all 0.2s ease-in-out;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
  font-weight: 500;
  letter-spacing: 0.62px;
  margin-bottom: -${getSize(0.1)};
  padding: 0 ${getSize(0.4)} ${getSize(1.6)};

  border-bottom: ${getSize(0.2)} solid transparent;

  :hover:not(.active) {
    opacity: 0.7;
  }

  &.active {
    color: ${getColor("primary")};
    font-weight: 600;

    border-color: ${getColor("primary")};
  }
`;
