import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const BannerContainer = styled.div`
  margin-top: ${getSize(2.4)};
  background-color: ${getColor("red")};
  color: ${getColor("white")};
  padding: ${getSize(1.6)} ${getSize(2.0)};
  display: flex;
  flex-direction: column;
  gap: ${getSize(1.6)};
  align-items: center;
  width: 100%;
  border-radius: ${getSize(0.4)};

  ${responsive("laptop")} {
    flex-direction: row;
  }
`;

export const BannerTitle = styled.h2`
  font-size: ${getSize(1.6)};
  margin: 0;
  font-weight: 600;
`;

export const BannerText = styled.span`
  font-size: ${getSize(1.4)};
  font-weight: 400;
`;

export const IconContainer = styled.div`
  display: none;
  align-items: center;
  justify-content: center;
  color: ${getColor("white")};

  ${responsive("laptop")} {
    display: flex;
  }
`;