import styled from "styled-components";
import { getColor, getSize, getProperty } from "~/helpers/style";

export const PageTitle = styled.h1`
  color: ${getColor("text")};
  line-height: 1.2;
  margin: 0;
  font-weight: 500;
  font-size: 20px;
  line-height: 180%;
`;

export const PageTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${getProperty("justifyContent", "space-between")};
  margin: 0 0 ${getSize(1.6)} 0;
  width: 100%;
`;
