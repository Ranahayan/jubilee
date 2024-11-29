import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColorWithAlpha, getSize } from "~/helpers/style";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Title = styled.h2`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  margin: 0 0 ${getSize(0.6)};
`;

export const Subtitle = styled.p`
  font-size: ${getSize(1.4)};
  margin: 0 0 ${getSize(1.6)};
  color: ${getColorWithAlpha("text", 0.5)};
`;

export const BackButton = styled(Button)`
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${getSize(0.8)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  min-width: ${getSize(9.0)};
  font-weight: 500;
`;
