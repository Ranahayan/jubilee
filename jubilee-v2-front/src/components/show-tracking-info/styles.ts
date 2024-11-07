import styled from "styled-components";
import { getColor, getColorWithAlpha, getSize } from "~/helpers/style";
import Button from "~/components/ui/Button";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 80vw;
  max-width: 400px;
`;

export const Title = styled.h2`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  margin: 0;
  margin-bottom: ${getSize(1.8)};
`;

export const BackButton = styled(Button)`
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${getSize(0.8)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  font-weight: 500;
  margin-top: ${getSize(1.8)};
`;

export const Icon = styled.div`
  background-color: ${getColorWithAlpha("primary", 0.1)};
  color: ${getColor("primary")};
  width: ${getSize(4.5)};
  height: ${getSize(4.5)};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  margin-bottom: ${getSize(1.8)};
`;

export const Label = styled.label`
  font-size: ${getSize(1.3)};
  padding-bottom: 0;
  font-weight: 500;
  color: ${getColorWithAlpha("text", 0.5)};
`;

export const Text = styled.div`
  font-size: ${getSize(1.5)};
  font-weight: 500;
  color: ${getColor("text")};
  margin-bottom: ${getSize(0.8)};
`;