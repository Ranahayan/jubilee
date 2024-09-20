import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const AddImage = styled.div`
  .file-uploader {
    height: ${getSize(5.8)};
    width: ${getSize(5.8)};
    background-color: ${getColor("primaryLight")};
    color: ${getColor("primary")};
    border-radius: ${getSize(0.8)};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
  }
`;

export const Image = styled.img`
  height: ${getSize(5.8)};
  border-radius: ${getSize(0.8)};
`;

export const ImageContainer = styled.div`
  position: relative;
`;

export const IconContainer = styled.div`
  position: absolute;
  padding: 0 ${getSize(0.6)};
  background-color: ${getColor("white")};
  border-radius: 50%;
  top: -8px;
  right: -8px;
  cursor: pointer;
`;
