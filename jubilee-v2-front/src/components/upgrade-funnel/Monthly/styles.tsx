import styled from "styled-components";
import Button from "~/components/ui/Button";
import Text from "~/components/ui/Text";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const SimpleText = styled.p`
  font-size: ${getSize(1.6)};
  margin: ${getSize(1.4)} 0 ${getSize(2.4)} 0;
  text-align: center;
`;

export const SimpleTextAnchor = styled.a`
  position: absolute;
  font-size: ${getSize(1.4)};
  color: ${getColor("textSecondary")};
  display: flex;
  gap: ${getSize(0.4)};
  cursor: pointer;
  text-decoration: none;
  bottom: 0;
  right: 0;
  bottom: 25px;
  right: 25px;

  &:hover {
    text-decoration: underline;
  }
`;

export const Title = styled.h1`
  font-weight: 700;
  font-size: ${getSize(2.8)};
  margin: 0;
  text-align: center;
  line-height: ${getSize(3.2)};
`;

export const HighlightText = styled.span`
  color: ${getColor("green")};
`;

export const Content = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  background-color: ${getColor("background")};
  padding: ${getSize(7.0)} ${getSize(3.2)};

  ${responsive("laptop")} {
    min-width: 850px;
    padding: ${getSize(7.0)} ${getSize(10.7)};
  }
`;

interface IStarsSvg extends UIProps {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export const StarsSvg = styled.svg<IStarsSvg>`
  position: absolute;

  top: ${({ top }) => (top ? getSize(top) : "auto")};
  bottom: ${({ bottom }) => (bottom ? getSize(bottom) : "auto")};
  left: ${({ left }) => (left ? getSize(left) : "auto")};
  right: ${({ right }) => (right ? getSize(right) : "auto")};

  & > path {
    stroke: ${getColor("primary")};
    fill: ${getColor("primary")};
  }
`;

export const TermsContent = styled.div`
  font-weight: 400;
  font-size: ${getSize(1.3)};
  margin: ${getSize(1.8)} auto 0 auto;
  color: ${getColor("textSecondary")};
`;

export const CenteredText = styled(Text)`
  margin: ${getSize(1.2)} 0;
  font-size: ${getSize(1.3)};
  font-weight: 400;
  font-style: italic;
  text-align: center;
  color: ${getColor("textSecondary")};
  opacity: 0.6;
`;

export const CTAButton = styled(Button)`
  margin-top: ${getSize(1.6)};
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  width: 70%;
  align-self: center;
  border-radius: 999px;
  font-weight: 600;
  font-size: ${getSize(2.0)};
  line-height: ${getSize(2.4)};
  padding: ${getSize(1.7)};
`;
