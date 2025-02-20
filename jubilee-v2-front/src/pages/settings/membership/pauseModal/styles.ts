import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getSize, responsive } from "~/helpers/style";

export const Header = styled.div`
  display: flex;

  background-color: ${getColor("primary")};
  padding: ${getSize(3.2)};
  align-items: center;
  justify-content: center;

  & > img {
    width: min(80%, ${getSize(20.0)});
    margin-right: auto;

    ${responsive("mobileL")} {
      width: min(100%, ${getSize(30.0)});
      margin-left: ${getSize(3.6)};
      margin-right: 0;
    }
  }
`;

export const Body = styled.div`
  padding: ${getSize(2.4)};
`;

export const Title = styled.p`
  margin: 0;
  font-weight: 700;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(2.8)};
  text-align: center;

  ${responsive("mobileM")} {
    margin-top: ${getSize(0.8)};
  }
`;

export const Description = styled.p`
  margin: ${getSize(0.8)} auto 0 auto;
  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
  color: ${getColor("textSecondary")};
  text-align: center;
  max-width: ${getSize(43.4)};
`;

export const Footer = styled.div`
  margin-top: ${getSize(3.2)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${getSize(1.2)};
`;

export const CancelButton = styled(Button)`
  font-weight: 600;
  min-width: 100%;
  border: solid 1px ${getColor("border")};

  ${responsive("mobileM")} {
    min-width: 33%;
  }
`;

export const ConfirmButton = styled(Button)`
  font-weight: 600;
  color: ${getColor("white")};
  background-color: ${getColor("primary")};
  flex: 1;
`;
