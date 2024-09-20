import { Link } from "react-router-dom";
import styled from "styled-components";
import { getColor } from "~/helpers/style";

export const StyledLink = styled(Link)`
  display: flex;
  width: auto;
  color: ${getColor("text")};

  &,
  :hover,
  :focus,
  :active {
    text-decoration: none;
  }
`;
