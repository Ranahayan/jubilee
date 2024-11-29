import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import { UIFlexProps } from "~/types/style";

interface BillingSelectRadioProps extends UIFlexProps {
  isActive?: boolean;
}

export const BillingSelectContainer = styled.div<BillingSelectRadioProps>`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: border 0.2s;
  padding: ${getSize(2.2)} ${getSize(2.4)};
  width: 100%;
  border-radius: ${getSize(1.2)};
  background: white;
  border: 1px solid
    ${({ isActive, ...rest }) =>
      getColor(isActive ? "primary" : "borderSecondary")(rest)};
`;

export const Title = styled.div`
  color: ${getColor("text")};
  flex: 1;
  margin-left: ${getSize(0.6)};
  font-size: ${getSize(1.4)};
  background-color: transparent;
  line-height: 130%;
  font-weight: 500;
`;

export const Description = styled.div`
  color: ${getColor("textSecondary")};
  margin-left: ${getSize(0.6)};
  font-size: ${getSize(1.4)};
  background-color: transparent;
`;

export const Image = styled.img`
  width: ${getSize(6)};
  width: ${getSize(5.6)};
  margin: 0 ${getSize(0.6)};
`;
