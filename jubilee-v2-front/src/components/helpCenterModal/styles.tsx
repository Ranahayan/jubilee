import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${getSize(1.2)};
  min-width: 65vw;
  align-items: center;
`;

export const MoreHelpText = styled.h3`
  color: ${getColor("text")};
  font-weight: 500;
  font-size: ${getSize(1.6)};
`;

export const MoreHelpLink = styled.a`
  color: ${getColor("primary")};
  text-decoration: underline;
  text-decoration-color: ${getColor("primary")};
  font-weight: 500;
  font-size: ${getSize(1.6)};
`;
