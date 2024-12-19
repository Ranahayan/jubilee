import { Link } from "react-router-dom";
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
  flex-direction: column;
  justify-content: center;
  align-items: center;

  ${responsive("tablet")} {
    flex-direction: row;
  }
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;

  ${responsive("tablet")} {
    min-width: 330px;
  }

  ${responsive("laptop")} {
    min-width: 380px;
  }
`;

export const SocialContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  width: 100%;

  ${responsive("tablet")} {
    min-width: 330px;
  }

  ${responsive("laptop")} {
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
  margin-bottom: 25px;
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

export const ForgotPassword = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 25px;
`;

export const VerticalSeparator = styled.div`
  display: none;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;

  ${responsive("tablet")} {
    display: flex;
  }
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

export const HorizontalSeparator = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  width: 100%;

  ${responsive("tablet")} {
    display: none;
  }
`;

export const HorizontalLine = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${getColor("disabled")};
`;

export const Form = styled.form`
  width: 100%;
`;

export const PolicyText = styled.div`
  font-size: 14px;
  color: ${getColor('textDisabled')};
  margin-top: 20px;
  margin-bottom: 25px;
  width: 380px;
  text-align: center;

`;

export const PolicyLinkText = styled.a`
  font-size: 14px;
  color: ${getColor("primary")};
  text-decoration: underline;
  font-weight: 500;

  :hover,
  :focus,
  :active {
    text-decoration: none;
  }
`;
