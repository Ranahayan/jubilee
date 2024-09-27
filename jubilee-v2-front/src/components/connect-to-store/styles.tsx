import styled from "styled-components";
import Button from "~/components/ui/Button";
import FlexContainer from "~/components/ui/FlexContainer";
import { getColor, getSize } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const HeaderContainer = styled(FlexContainer)`
  gap: ${getSize(1.2)};
  position: relative;
`;

interface IHeaderImgContainer extends UIProps {
  backgroundColor: string;
  padding?: number;
}

export const HeaderImgContainer = styled.div<IHeaderImgContainer>`
  border-radius: 50%;
  width: ${getSize(4.8)};
  height: ${getSize(4.8)};
  padding: ${({ padding }) => getSize(padding ?? 1.0)};

  background-color: ${({ backgroundColor }) => getColor(backgroundColor)};

  display: flex;
  align-items: center;
  justify-content: center;

  & > img {
    width: 100%;
  }
`;

export const HeaderImgSeparatorContainer = styled.div`
  position: absolute;
`;

export const Title = styled.h1`
  font-weight: 700;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(2.8)};
  text-align: center;
  margin: 0;
`;

export const Description = styled.p`
  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
  text-align: center;
  color: ${getColor("textSecondary")};
  margin: 0;
`;

export const InputLabelStyleStyled = styled.span`
  font-weight: 500;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
`;

export const InputContainer = styled.div`
  display: flex;
  width: 100%;
`;

export const ShopifyInputContent = styled.div`
  background: ${getColor("borderSecondary")};
  border: 1px solid ${getColor("border")};
  border-left: none;
  color: ${getColor("text")};
  font-size: ${getSize(1.6)};
  padding: ${getSize(1.2)};
  border-radius: 0 ${getSize(0.6)} ${getSize(0.6)} 0;
`;

export const ConnectButton = styled(Button)`
  margin-top: ${getSize(1.2)};
  width: 100%;
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  font-weight: 600;
  font-size: ${getSize(1.6)};
  line-height: ${getSize(2.4)};
  padding: ${getSize(1.0)} ${getSize(1.5)};
`;

export const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  margin-top: ${getSize(1.2)};

  font-weight: 400;
  font-size: ${getSize(1.6)};

  display: flex;
  align-items: baseline;
`;

export const RedirectToShopifyButton = styled(Button)`
  color: ${getColor("primary")};
  padding: ${getSize(0.2)};

  font-size: ${getSize(1.6)};
  font-weight: 500;

  margin-left: ${getSize(0.2)};
  margin-top: ${getSize(0.1)};
`;
