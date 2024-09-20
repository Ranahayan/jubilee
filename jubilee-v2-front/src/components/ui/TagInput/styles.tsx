import styled from "styled-components";
import TagsInput from "react-tagsinput";
import "react-tagsinput/react-tagsinput.css";
import { getColor, getSize } from "~/helpers/style";

export const TagsInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const TagsInputStyled = styled(TagsInput)`
  .react-tagsinput-tag {
    background-color: ${getColor("borderSecondary")};
    color: ${getColor("text")};
    border: 1px solid ${getColor("border")};
    border-radius: ${getSize(0.6)};
    margin: ${getSize(0.8)} 0 ${getSize(0.8)} ${getSize(0.8)};
    padding: ${getSize(0.4)} ${getSize(1.0)};
    font-size: ${getSize(1.4)};

    .react-tagsinput-remove {
      &:hover {
        color: ${getColor("red")};
      }

      &::before {
        font-size: ${getSize(1.6)};
      }
    }
  }
`;

export const Count = styled.span`
  font-size: ${getSize(1.4)};
  text-align: end;
  padding: ${getSize(0.5)};
  color: ${getColor("textSecondary")};
  position: absolute;
  bottom: 0;
  right: 0;

  &.max {
    color: ${getColor("red")};
  }
`;
