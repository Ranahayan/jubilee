import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const StatusStyle = styled.div`
  font-size: ${getSize(1.2)};
  margin: 0 auto;
  padding: ${getSize(0.2)} ${getSize(1.2)};
  border-radius: ${getSize(1.5)};
  color: ${getColor("text")};
  background-color: ${getColor("borderSecondary")};
  width: fit-content;

  &.paid,
  &.succeeded {
    color: ${getColor("green")};
    background-color: ${getColor("greenSecondary")};
  }

  &.unpaid,
  &.failed {
    color: ${getColor("red")};
    background-color: ${getColor("redSecondary")};
  }

  &.pending {
    color: ${getColor("yellow")};
    background-color: ${getColor("yellowSecondary")};
  }
`;
