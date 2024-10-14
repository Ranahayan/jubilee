import styled from "styled-components";
import Button from "~/components/ui/Button";
import { getColor, getSize, responsive } from "~/helpers/style";

export const Container = styled.div`
  padding: ${getSize(2.4)};
  background-color: #f7f7f7;
`;

export const Title = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: ${getSize(1.8)};
  line-height: ${getSize(1.8)};
`;

export const Description = styled.p`
  margin: ${getSize(0.8)} 0 0 0;

  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
`;

export const UploaderContainer = styled.div`
  margin-top: ${getSize(2.0)};

  & .file-uploader {
    border: none;
    background-color: ${getColor("white")};
  }
`;

export const InnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${getSize(1.6)} ${getSize(2.4)};
  min-height: ${getSize(18.9)};
`;

export const IconContainer = styled.div`
  width: ${getSize(4.0)};
  height: ${getSize(4.0)};
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  background-color: ${getColor("textSecondary")}1A;
`;

export const UploadText = styled.p`
  margin: ${getSize(1.2)} 0 0 0;
  font-weight: 400;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
`;

export const HighlightedText = styled.span`
  font-weight: 600;
  color: ${getColor("primary")};
`;

export const FileTypeText = styled.p`
  margin: ${getSize(0.4)} 0 0 0;
  font-weight: 400;
  font-size: ${getSize(1.2)};
  line-height: ${getSize(1.6)};
  color: ${getColor("textSecondary")};
`;

export const Footer = styled.div`
  margin-top: ${getSize(3.2)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${getSize(1.2)};
`;

export const CancelButton = styled(Button)`
  font-weight: 600;
  font-size: ${getSize(1.6)};
  line-height: ${getSize(2.4)};
  min-width: 25%;
  width: 100%;

  ${responsive("mobileL")} {
    width: 25%;
  }
`;

export const SubmitButton = styled(Button)`
  background-color: ${getColor("primary")};
  color: ${getColor("white")};
  font-weight: 600;
  font-size: ${getSize(1.6)};
  line-height: ${getSize(2.4)};
  flex: 1;
`;
