import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import Button from "~/components/ui/Button";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 80vw;
  max-width: 670px;
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
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: ${getSize(0.8)} 0;
`;

export const Label = styled.label`
  font-size: ${getSize(1.4)};
  padding-bottom: 0;
  font-weight: 600;
  color: ${getColor("text")};
`;

export const Text = styled.div`
  font-size: ${getSize(1.4)};
  font-weight: 400;
  color: ${getColor("text")};
`;

export const TextPrimary = styled.div`
  font-size: ${getSize(1.4)};
  font-weight: 400;
  color: ${getColor("primary")};
`;

export const Summary = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${getSize(1.8)};
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-top: ${getSize(2.0)};
  gap: ${getSize(1.4)};
  margin-bottom: ${getSize(2.0)};

  input {
    margin-top: ${getSize(0.6)};
  }
`;

export const ScrollableTable = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

export const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;