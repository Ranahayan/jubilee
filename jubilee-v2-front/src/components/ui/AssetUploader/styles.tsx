import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import Text from "../Text";

export const AddFileContainer = styled.div`
  .file-uploader {
    text-align: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: ${getSize(0.8)};
    min-height: ${getSize(15.4)};
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    border: 1px solid ${getColor("borderSecondary")};
    border-radius: ${getSize(0.4)};
  }
`;

export const AddFileText = styled.div`
  padding: ${getSize(0.5)} ${getSize(0.8)};
  border-radius: ${getSize(0.4)};
  background-color: ${getColor("primaryLight")};
  color: ${getColor("primary")};
  font-size: ${getSize(1.4)};

  &:hover {
    opacity: 0.8;
  }
`;

export const Image = styled.img`
  width: 100%;
  height: ${getSize(18.9)};
  object-fit: cover;
  border-radius: ${getSize(0.4)};
`;

export const SmallText = styled(Text)`
  font-size: ${getSize(1.2)};
  max-width: ${getSize(21.6)};
`;
