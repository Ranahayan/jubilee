import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const ListTitle = styled.h3`
  font-weight: 500;
  font-size: 14px;
  line-height: 130%;
  color: ${getColor("text")};
  margin: 0;
`;

export const List = styled.ul`
  margin: 0;
  padding-inline-start: ${getSize(2)};
`;

export const ListItem = styled.li`
  font-weight: 400;
  font-size: 13px;
  line-height: 130%;
  margin-bottom: ${getSize(0.6)};
  color: ${getColor("textSecondary")};
`;
