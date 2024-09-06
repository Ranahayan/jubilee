import styled from "styled-components";
import { StyledLink } from "~/components/ui/Styled/Link";
import { getColor, responsive } from "~/helpers/style";

export const Container = styled.div`
  height: 100vh;
  display: flex;
`;

export const LinkText = styled(StyledLink)`
  font-size: 15px;
  color: ${getColor("primary")};
  text-decoration: underline;
  font-weight: 500;
`;

export const LogoContainer = styled.div`
  height: 40px;
`;

export const TemplateContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 45px;
  width: 100%;
  height: 100%;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-self: flex-start;
`;

export const LoginContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  ${responsive("tablet")} {
    min-width: 380px;
  }
`;

export const SocialContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;

  ${responsive("tablet")} {
    min-width: 380px;
  }
`;

export const SignText = styled.span`
  align-self: flex-start;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  font-weight: 400;
  margin-top: -15px;
  margin-bottom: 20px;
  text-align: center;
  max-width: 550px;
`;

export const FacebookButton = styled.div`
  width: 100%;
  height: 40px;
  background-color: #191919;
  color: #fff;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
`;

export const VerticalSeparator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
`;

export const VerticalLine = styled.div`
  height: 60px;
  width: 1px;
  background-color: ${getColor("disabled")};
`;

export const VerticalText = styled.span`
  font-size: 12px;
  font-weight: 400;
  margin: 0 10px;
  color: ${getColor("textDisabled")}99;
`;

export const ButtonContainer = styled.div`
  gap: 60px;
  width: 100%;
  display: flex;
  margin-top: 15px;
  justify-content: center;
`;
