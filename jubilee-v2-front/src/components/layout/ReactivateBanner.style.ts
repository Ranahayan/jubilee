import styled from "styled-components";
import { getColor, getShadow, getSize, responsive } from "~/helpers/style";
import FlexContainer from "../ui/FlexContainer";

export const ReactivateBannerContainer = styled.div`
  margin-top: ${getSize(2.4)};
  display: flex;
  flex-direction: column;
  background-color: ${getColor("primaryLight")};
  border-radius: ${getSize(0.6)};
  box-shadow: ${getShadow("md")};
  width: 100%;
  overflow: hidden;

  ${responsive("laptop")} {
    height: ${getSize(21.4)};
    gap: ${getSize(5.5)};
    flex-direction: row;
  }
`;

export const ReactivateMessage = styled.div`
  position: relative;
  background-color: ${getColor("white")};
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: ${getSize(3.2)};

  ${responsive("laptop")} {
    width: 30%;
  }

  &:before {
    content: "";
    top: 0;
    left: 0;
    position: absolute;
    background-color: ${getColor("red")};
    width: 100%;
    height: ${getSize(0.7)};

    ${responsive("laptop")} {
      width: ${getSize(0.7)};
      height: 100%;
    }
  }
`;

export const MessageText = styled.span`
  color: ${getColor("redDark")};
  font-size: ${getSize(1.4)};
  width: 100%;

  ${responsive("laptop")} {
    max-width: ${getSize(25.4)};
  }
`;

export const BoldText = styled.span`
  font-weight: 600;
`;

export const IconCircle = styled.div`
  background-color: ${getColor("primaryLight")};
  color: ${getColor("primary")};
  border-radius: 50%;
  width: ${getSize(5.0)};
  height: ${getSize(5.0)};
  position: absolute;
  font-size: ${getSize(3.0)};
  display: flex;
  justify-content: center;
  align-items: center;
  filter: contrast(95%);
  left: 0;
  right: 0;
  bottom: -27px;
  margin-inline: auto;

  ${responsive("laptop")} {
    right: -27px;
    left: auto;
    bottom: auto;
  }
`;

export const ReactivatePlanInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${getSize(1.0)};
  position: relative;

  ${responsive("laptop")} {
    padding: 0 ${getSize(2.4)};
  }
`;

export const PlanTitle = styled.h1`
  margin: 0;
  font-size: ${getSize(2.2)};
  color: ${getColor("text")};
  font-weight: 600;
`;

export const PrimaryBold = styled.span`
  font-weight: 600;
  color: ${getColor("primary")};
`;

export const PlanCTA = styled.h3`
  margin: 0;
  font-size: ${getSize(1.6)};
  color: ${getColor("text")};
  font-weight: 600;
`;

export const IconCheckContainer = styled.div`
  background-color: ${getColor("greenSecondary")};
  color: ${getColor("green")};
  border-radius: 50%;
  width: ${getSize(2.0)};
  height: ${getSize(2.0)};
  font-size: ${getSize(1.2)};
  display: flex;
  justify-content: center;
  align-items: center;
  filter: contrast(95%);
`;

export const TextFlex = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  flex: 0 1 50%;
  line-height: 2.29;
  align-items: center;
  margin-bottom: ${getSize(1.0)};
`;

export const EmojiContainer = styled.div`
  display: flex;
  font-size: ${getSize(3.6)};
  width: ${getSize(6.0)};
  height: ${getSize(6.0)};
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: ${getColor("white")};
`;

export const PaddingFlexContainer = styled(FlexContainer)`
  padding: ${getSize(2.4)};

  ${responsive("laptop")} {
    padding: ${getSize(2.4)} 0;
  }
`;

export const Emoji = styled.span`
  margin-bottom: ${getSize(0.3)};
`;
