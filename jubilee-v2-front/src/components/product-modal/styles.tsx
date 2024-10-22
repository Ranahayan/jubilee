import exp from "constants";
import styled from "styled-components";
import FlexContainer from "~/components/ui/FlexContainer";
import { PageTitle } from "~/components/ui/PageTitle/styles";
import Text from "~/components/ui/Text";
import { getColor, getSize } from "~/helpers/style";

export const StockInfo = styled.div`
  border-radius: ${getSize(2.0)};
  font-size: ${getSize(1.4)};
  color: ${getColor("primary")};
  background-color: ${getColor("primaryLight")};
  padding: ${getSize(0.2)} ${getSize(1.0)};
  min-width: ${getSize(10.4)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Title = styled(PageTitle)`
  font-size: ${getSize(2.4)};
`;

export const FlexItem = styled(FlexContainer)`
  flex: 1;
`;

interface IStyledText {
  primary?: boolean;
}

export const StyledText = styled(Text)<IStyledText>`
  color: ${({ primary }) => (primary ? getColor("primary") : getColor("text"))};
  font-weight: 500;
`;

export const ProductDescription = styled.div`
  font-size: ${getSize(1.4)};

  ul {
    margin: 0;
    padding: ${getSize(0.2)} ${getSize(2.4)};
    line-height: 1.8;
  }
`;

export const ShippingContainer = styled.div`
  width: 100%;
  border: 1px solid ${getColor("borderSecondary")};
  border-radius: ${getSize(1.4)};
  padding: ${getSize(1.7)};
  display: flex;
  flex-direction: column;
  gap: ${getSize(1.4)};
`;

export const ProcessingTimeContainer = styled(ShippingContainer)`
  gap: 0;
`;

export const ProductDescriptionTitle = styled.p`
  font-size: ${getSize(1.6)};
  font-weight: 500;
  color: ${getColor("text")};
  margin: 0;
`;

export const DecoratedText = styled(Text)`
  text-decoration: underline;
`;
