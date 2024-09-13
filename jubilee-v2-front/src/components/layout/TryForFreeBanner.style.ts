import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getSize, responsive } from "~/helpers/style";

export const BannerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin: ${getSize(3.0)} 0;
  gap: ${getSize(3.0)};

  background-color: ${getColor("white")};
  border: solid 1px ${getColor("border")};
  border-radius: ${getSize(0.6)};

  padding: ${getSize(2.4)} ${getSize(4.2)};
`;

export const Title = styled.p`
  font-weight: 700;
  font-size: ${getSize(2.0)};
  line-height: ${getSize(3.0)};
  margin: 0;
`;

export const Subtitle = styled.p`
  font-weight: 400;
  font-size: ${getSize(1.3)};
  line-height: ${getSize(2.0)};
  color: ${getColor("textSecondary")};
  margin: 0;
`;

export const FooterContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;

  gap: ${getSize(1.8)};
  margin-top: ${getSize(1.2)};

  ${responsive("laptopL")} {
    flex-direction: row;
  }
`;

export const ClaimOfferButton = styled(Button)`
  align-self: stretch;
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  font-weight: 600;
  font-size: ${getSize(1.6)};
  padding: ${getSize(1.0)} ${getSize(3.0)};
`;

export const DiscountTagContainer = styled.div`
  display: none;

  position: relative;
  isolation: isolate;
  margin-right: ${getSize(3.0)};

  ${responsive("laptop")} {
    display: block;
  }
`;

export const DiscountTagText = styled.span`
  position: absolute;
  font-size: ${getSize(3.0)};
  font-weight: 900;
  color: ${getColor("white")};

  z-index: 3;

  top: 50%;
  left: 50%;

  transform: translateY(-68%) translateX(-59%);
`;

export const DiscountTag = styled.div`
  position: relative;
  z-index: 2;
  color: ${getColor("primary")};
`;

export const DiscountTagBackground = styled.div`
  position: absolute;
  top: -50%;
  right: -50%;
  transform: translateY(20%) translateX(-30%);

  height: ${getSize(12.0)};
  width: ${getSize(12.0)};
  border-radius: 50%;
  background-color: ${getColor("primaryLight")};
`;
