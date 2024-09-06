import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";

export const Footer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: ${getSize(1.4)};
  gap: ${getSize(0.8)};
`;

export const Title = styled.span`
  color: ${getColor("text")};
  font-weight: 500;
  font-size: 16px;
`;

export const FormContainer = styled.div`
  margin-top: ${getSize(2.4)};
  width: 100%;
`;

export const ForgotPasswordContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 25px;
`;