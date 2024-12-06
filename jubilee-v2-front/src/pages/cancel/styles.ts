import styled from "styled-components";
import { TextArea } from "~/components/ui/Input/styles";
import { getColor, getSize, responsive } from "~/helpers/style";

export const CancelationContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${getColor("background")};
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: center;
  gap: ${getSize(3.4)};
  flex: 1;
  max-width: ${getSize(94.8)};
  width: 100%;
  height: 100%;
  padding: ${getSize(7.4)} 0;
`;

export const Title = styled.h1`
  font-size: ${getSize(2.0)};
  font-weight: 500;
  color: ${getColor("text")};
  margin-bottom: ${getSize(3.2)};
`;

export const TitleBold = styled.span`
  font-weight: 600;
`;

export const Content = styled.div`
  display: flex;
  gap: ${getSize(1.0)};
  padding: ${getSize(3.1)};
  flex-direction: column;
  width: 100%;
  border-radius: ${getSize(1.4)};
  background-color: ${getColor("white")};
`;

export const ContentTitle = styled.h2`
  font-size: ${getSize(1.8)};
  font-weight: 700;
  margin: 0;
  color: ${getColor("text")};
`;

export const PauseDescription = styled.span`
  font-size: ${getSize(1.4)};
  color: ${getColor("textSecondary")};
  max-width: ${getSize(50.2)};
  width: 100%;
`;

export const HelpText = styled.span`
  font-size: ${getSize(1.6)};
  color: ${getColor("text")};
  max-width: ${getSize(35.3)};
  width: 100%;
`;

export const HelpTextBold = styled.span`
  font-weight: 600;
`;

export const ImportantContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: ${getSize(2.0)};
  width: 100%;
  margin: ${getSize(3.4)} 0;
`;

export const ImportantText = styled.span`
  font-size: ${getSize(1.6)};
  color: ${getColor("text")};
  font-weight: 500;
  max-width: ${getSize(62.5)};
  width: 100%;
  text-align: center;
`;

export const StyledTextArea = styled(TextArea)`
  height: ${getSize(15.0)};
  border: 1px solid ${getColor("border")};
`;

export const PausePlanImgContainer = styled.div`
  display: flex;
  background-color: ${getColor("primary")};
  padding: ${getSize(2.4)};
  align-items: center;
  justify-content: center;

  & > img {
    width: min(65%, ${getSize(20.0)});
    margin-right: auto;

    ${responsive("mobileL")} {
      width: min(80%, ${getSize(30.0)});
      margin-left: ${getSize(3.6)};
      margin-right: 0;
    }
  }
`;

export const RequiredFlag = styled.span`
  color: ${getColor("red")};
  font-weight: 700;
  font-size: ${getSize(1.2)};
  border-radius: ${getSize(2.9)};
  padding: 0 ${getSize(0.8)};
  background-color: ${getColor("redSecondary")};
`;

export const RecommendedFlag = styled.span`
  color: ${getColor("primary")};
  font-weight: 700;
  font-size: ${getSize(1.2)};
  border-radius: ${getSize(2.9)};
  padding: 0 ${getSize(0.8)};
  text-transform: uppercase;
  background-color: ${getColor("primaryLight")};
`;
