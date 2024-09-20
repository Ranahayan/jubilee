import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const TagContainer = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  background-color: ${getColor("borderSecondary")};
  padding: ${getSize(0.6)} ${getSize(1.2)};
  border-radius: ${getSize(0.6)};
  cursor: pointer;
  max-width: 100%;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
`;
