import styled from "styled-components";
import { getColor } from "~/helpers/style";
import { ComponentPropsWithoutRef } from "react";

export type TextProps = {
  secondary?: boolean;
} & ComponentPropsWithoutRef<"span">;

export const Text = styled.span<TextProps>`
  font-size: 14px;
  line-height: 141%;
  font-weight: 400;
  color: ${(props) =>
    getColor(props.secondary ? "textSecondary" : "text")(props)};

  & > strong {
    font-weight: 500;
  }
`;
