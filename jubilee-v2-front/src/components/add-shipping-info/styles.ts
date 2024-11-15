import styled from "styled-components";
import { getColor, getColorWithAlpha, getSize } from "~/helpers/style";
import Button from "~/components/ui/Button";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 80vw;
  max-width: 400px;

  label {
    font-size: ${getSize(1.4)};
    padding-bottom: 0;
  }

  [cols="6"], [cols="12"] {
    margin: 0;

    > div {
      gap: ${getSize(0.2)};
    }
  }
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
  min-width: ${getSize(9.0)};
  font-weight: 500;
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
