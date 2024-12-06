import styled from "styled-components";
import Button from "~/components/ui/Button";
import {
  getBorderRadius,
  getColor,
  getSize,
  responsive,
} from "~/helpers/style";

export const IconContainer = styled.div`
  background-color: ${getColor("primaryLight")};
  width: ${getSize(4.8)};
  height: ${getSize(4.8)};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Title = styled.p`
  margin: ${getSize(2.0)} 0 0 0;
  font-weight: 600;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(2.8)};
`;

export const Description = styled.p`
  margin: ${getSize(0.8)} 0 0 0;
  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.2)};

  ${responsive("laptop")} {
    max-width: 80%;
  }
`;

export const TestimonialContainer = styled.div`
  margin-top: ${getSize(2.0)};
  background-color: ${getColor("background")};
  border-radius: ${getBorderRadius(1.2)};
  padding: ${getSize(0.6)} ${getSize(1.2)};
  display: flex;
  align-items: flex-start;
  gap: ${getSize(1.2)};
`;

export const TestimonialImage = styled.img`
  width: ${getSize(4.0)};
  height: ${getSize(4.0)};
  border-radius: 50%;
  background-color: ${getColor("textSecondary")};
  margin-top: ${getSize(0.2)};
`;

export const TestimonialText = styled.span`
  font-weight: 400;
  font-style: italic;
  font-size: ${getSize(1.3)};
  line-height: ${getSize(2.2)};

  ${responsive("laptop")} {
    max-width: 80%;
  }
`;

export const SwitchButton = styled(Button)`
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  margin-top: ${getSize(3.2)};
  width: 100%;

  font-weight: 600;
  font-size: ${getSize(1.6)};
  line-height: ${getSize(2.4)};
  padding: ${getSize(1.0)};
`;

export const DisclaimerText = styled.p`
  font-weight: 400;
  font-style: italic;
  font-size: ${getSize(1.3)};
  line-height: ${getSize(2.2)};
  color: ${getColor("textSecondary")};

  margin: ${getSize(1.8)} 0 0 0;
  text-align: center;
`;
