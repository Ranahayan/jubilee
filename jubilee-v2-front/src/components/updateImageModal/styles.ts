import styled from "styled-components";
import Text from "~/components/ui/Text";
import { getColor, getSize, responsive } from "~/helpers/style";

export const Container = styled(Text)`
  display: flex;
  flex-direction: column;
  padding: ${getSize(2.4)};
  align-items: flex-start;
  justify-content: flex-start;
  background-color: ${getColor("background")};
  gap: ${getSize(1.6)};

  ${responsive("mobileS")} {
    min-width: 300px;
  }

  ${responsive("tablet")} {
    min-width: 330px;
  }

  ${responsive("laptop")} {
    min-width: 620px;
  }

  & .file-uploader {
    height: 100%;
    width: 100%;
  }
`;

export const CenteredText = styled(Text)`
  text-align: center;
`;

export const ModalTitle = styled(Text)`
  font-size: ${getSize(1.8)};
  font-weight: 600;
  color: ${getColor("text")};
`;

export const ModalDescription = styled(Text)`
  font-size: ${getSize(1.4)};
  color: ${getColor("textSecondary")};
`;

export const IconContainer = styled.div`
  padding: ${getSize(1.4)};
  border-radius: 50%;
  background-color: ${getColor("primaryLight")};

  svg {
    color: ${getColor("primary")};
  }
`;

export const DragAndDropContainer = styled.div`
  display: flex;
  width: 100%;
  gap: ${getSize(0.6)};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${getSize(2)};
  border-radius: ${getSize(0.8)};
  background-color: ${getColor("white")};
`;

export const ClickUploadText = styled.span`
  color: ${getColor("primary")};
  font-size: ${getSize(1.4)};
  font-weight: 600;
  cursor: pointer;
`;
