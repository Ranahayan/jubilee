import styled from "styled-components";
import {
  getBorderRadius,
  getFadeInAnimation,
  getSize,
  responsive,
} from "~/helpers/style";
import { UIProps } from "~/types/style";

interface ImageProps extends UIProps {
  background: string;
}

export const Image = styled.div<ImageProps>`
  display: block;
  width: 100%;
  height: 100%;
  border-radius: ${getBorderRadius(1.1)};
  background-image: url(${({ background }) => background || ""});
  background-position: center;
  background-size: cover;
  ${getFadeInAnimation(0.2)}
`;

export const Container = styled.div`
  position: relative;
  display: block;
  width: 100%;
  height: ${getSize(30)};
  min-height: ${getSize(30)};

  ${responsive("tablet")} {
    height: ${getSize(35)};
    min-height: ${getSize(35)};
  }
  ${responsive("laptop")} {
    height: ${getSize(40)};
    min-height: ${getSize(40)};
  }

  & .file-uploader {
    height: 100%;

    & svg {
      display: none;

      & + div {
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }
  }
`;
