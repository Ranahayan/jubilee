import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";
import Text from "~/components/ui/Text";
import FlexContainer from "~/components/ui/FlexContainer";

export const MembershipInfoContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${getSize(5.0)};
  width: 100%;
`;

export const CenteredText = styled.div`
  text-align: center;
`;

export const StyledClickableText = styled.span`
  color: ${getColor("primary")};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

export const ShowMembershipText = styled.span<{ display: string }>`
  display: ${({ display }) => display};
`;

export const MembershipItemText = styled.span`
  font-size: ${getSize(1.6)};
  color: ${getColor("text")};
  font-weight: 500;
`;

export const GreyText = styled.span`
  color: ${getColor("textSecondary")};
  font-size: ${getSize(1.4)};
`;

export const CancelledFlag = styled.span`
  font-size: ${getSize(1.2)};
  color: ${getColor("textSecondary")};
  background-color: ${getColor("borderSecondary")};
  padding: 0px ${getSize(0.6)};
  border-radius: ${getSize(1.5)};
`;

export const PausedFlag = styled.span`
  font-size: ${getSize(1.2)};
  color: ${getColor("yellow")};
  background-color: ${getColor("yellowSecondary")};
  padding: 0px ${getSize(0.6)};
  border-radius: ${getSize(1.5)};
`;

export const TrialFlag = styled.span`
  font-size: ${getSize(1.2)};
  color: ${getColor("yellow")};
  background-color: ${getColor("orangeSecondary")};
  padding: 0px ${getSize(0.6)};
  border-radius: ${getSize(1.5)};
`;

export const ActiveFlag = styled.span`
  font-size: ${getSize(1.2)};
  color: ${getColor("green")};
  background-color: ${getColor("greenSecondary")};
  padding: 0px ${getSize(0.6)};
  border-radius: ${getSize(1.5)};
`;

export const MembershipItem = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: ${getSize(1.2)};
  margin-top: ${getSize(3.0)};
`;

export const StyledText = styled(Text)`
  max-width: 270px;
  width: 100%;
  font-size: 16px;
`;

export const ClickableText = styled(Text)`
  cursor: pointer;
`;

export const PauseText = styled.span`
  color: ${getColor("primary")};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

export const BoldText = styled.span`
  font-weight: 500;
  color: ${getColor("text")};
`;

export const BoldTextPrimary = styled.span`
  font-weight: 500;
  color: ${getColor("primary")};
`;

export const BoldTextPrimaryClickable = styled.span`
  font-weight: 500;
  color: ${getColor("primary")};
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

export const SetPasswordTitle = styled(Text)`
  font-size: ${getSize(2.0)};
  font-weight: 500;
`;

export const StyledLink = styled.span`
  color: ${getColor("primary")};
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

export const FlexContainerStyled = styled(FlexContainer)`
  max-width: ${getSize(50.0)};
`;

export const TransactionId = styled.div`
  max-width: ${getSize(15.0)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
