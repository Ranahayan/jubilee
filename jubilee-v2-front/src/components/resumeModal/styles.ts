import styled from "styled-components";
import Button from "~/components/ui/Button";
import { SVG } from "~/components/ui/SVG";
import { getColor, getSize, responsive } from "~/helpers/style";

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: ${getSize(1.2)};
`;

export const IconContainer = styled.div`
  position: relative;
`;

export const Logo = styled.img`
  width: ${getSize(2.6)};
  height: ${getSize(2.6)};

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  position: absolute;
`;

export const LogoArrow = styled(SVG)`
  width: ${getSize(7.4)};
  height: ${getSize(7.4)};
`;

export const Title = styled.p`
  font-weight: 600;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(2.8)};
  margin: ${getSize(2.0)} 0 0 0;
  text-align: center;
`;

export const Description = styled.p`
  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
  color: ${getColor("textSecondary")};
  text-align: center;
  margin: ${getSize(0.8)} 0 0 0;
`;

export const CancelButton = styled(Button)`
  font-weight: 600;
  min-width: 100%;
  border: solid 1px ${getColor("border")};

  ${responsive("mobileL")} {
    min-width: 33%;
  }
`;

export const ConfirmButton = styled(Button)`
  font-weight: 600;
  color: ${getColor("white")};
  background-color: ${getColor("primary")};
  flex: 1;
`;

export const FeaturesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: ${getSize(1.1)};

  ${responsive("tablet")} {
    grid-template-columns: 1fr 1fr;
  }
`;

export const FeatureText = styled.div`
  font-size: ${getSize(1.4)};
  font-weight: 400;
`;
