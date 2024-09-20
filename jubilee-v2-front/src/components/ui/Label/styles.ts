import styled from "styled-components";
import { getFontWeight, getSize } from "~/helpers/style";
import { UIFlexProps, UIProps } from "~/types/style";

interface ILabel extends UIProps {
  small?: boolean;
  width?: UIFlexProps["width"];
}

export const Label = styled.label<ILabel>`
  display: flex;
  flex-direction: row;
  gap: ${getSize(0.8)};
  overflow: hidden;
  width: ${({ width }) => (width ? width : "fit-content")};
  white-space: nowrap;
  text-overflow: ellipsis;
  ${({ small }) =>
    small
      ? `
  font-size: 15px;
  line-height: 180%;
  `
      : `
  font-size: 16px;
  line-height: 19px;
  `}
  font-weight: ${getFontWeight(500)};
  padding-bottom: 4px;
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;
