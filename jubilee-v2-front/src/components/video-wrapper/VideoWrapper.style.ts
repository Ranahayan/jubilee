import styled, { css } from "styled-components";
import { responsive, getSize, getColor } from "~/helpers/style";
import { UIProps } from "~/types/style";

interface ITitle extends UIProps {
  selected: boolean;
}

export const Video = styled.div`
  position: relative;
  width: 100%;
  padding-top: ${getSize(2)};
  margin-bottom: ${getSize(1)};

  ${responsive("tablet")} {
    width: 50%;
  }
`;

export const Header = styled.p`
  margin: 0;
  font-size: ${getSize(1.9)};
  font-weight: 600;
`;

export const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

export const Titles = styled.div`
  width: 100%;
  border: none;
  margin: 0;
  padding-top: ${getSize(1.3)};

  ${responsive("tablet")} {
    margin-left: ${getSize(2)};
    border-left: 1px solid ${getColor("borderSecondary")};
    padding-left: ${getSize(2)};
    width: 50%;
  }
`;

export const TitleContainer = styled.div<ITitle>`
  display: flex;
  font-size: ${getSize(1.5)};
  align-items: center;
  padding: ${getSize(0.5)};
  border-bottom: 1px solid ${getColor("borderSecondary")};
  margin-bottom: ${getSize(1)};
  cursor: pointer;
  color: ${getColor("textSecondary")};
  font-weight: 400;

  &:hover {
    background-color: ${getColor("background")};
  }

  ${({ selected }) =>
    selected &&
    css`
      font-weight: 500;
      color: ${getColor("primary")};
    `}

  &:last-child {
    border: none;
  }
`;

export const Title = styled.div`
  margin-left: ${getSize(1)};
  flex: 1;
`;

export const VideoContainer = styled.div`
  padding: ${getSize(1.2)} ${getSize(2)} ${getSize(2)};
  color: ${getColor("text")};
  font-weight: 500;
  font-size: ${getSize(2)};
  background-color: ${getColor("backgroundSecondary")};
  margin: ${getSize(5.8)} 0 ${getSize(2)};
  width: 100%;
  height: auto;
`;

export const VideoContent = styled.div`
  border-top: 1px solid ${getColor("borderSecondary")};
  margin-top: ${getSize(1)};
  height: auto;
  min-height: 360px;
  display: block;

  ${responsive("tablet")} {
    display: flex;
  }
`;
