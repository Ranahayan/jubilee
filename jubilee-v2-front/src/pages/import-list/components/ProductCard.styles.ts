import styled from "styled-components";
import Button from "~/components/ui/Button";
import Container from "~/components/ui/Container";
import { TextArea } from "~/components/ui/Input/styles";
import Text from "~/components/ui/Text";
import { getColor, getSize, responsive } from "~/helpers/style";
import { UIProps } from "~/types/style";

export const CardTitle = styled.h3`
  color: ${getColor("text")};
  font-size: ${getSize(1.6)};
  font-weight: 500;
  margin: 0;
`;

export const TextBold = styled(Text)`
  font-weight: 500;
`;

export const ImageContainer = styled.div`
  height: ${getSize(32.2)};
  width: 100%;
  background-color: ${getColor("borderSecondary")};
  border-radius: ${getSize(0.7)};
  margin-top: 15px;

  img {
    width: 100%;
    height: ${getSize(32.2)};
  }

  ${responsive("laptopL")} {
    margin-top: 0px;
    height: ${getSize(37.2)};
    width: ${getSize(33.6)};

    img {
      width: ${getSize(33.6)};
      height: ${getSize(37.2)};
    }
  }

  img {
    border-radius: ${getSize(0.7)};
  }
`;

export const StyledTextArea = styled(TextArea)`
  border: 1px solid ${getColor("borderSecondary")};
  color: ${getColor("secondary")};
  font-size: ${getSize(1.4)};
  height: ${getSize(18.2)};
`;

export const RemoveProductContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${getSize(1.0)};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

interface IStyledContainer extends UIProps {
  overflow?: string;
}

export const StyledContainer = styled(Container)<IStyledContainer>`
  position: relative;
`;

export const SaveButton = styled(Button)`
  background-color: ${getColor("primary")}15;
`;

export const RemoveButton = styled(Button)`
  background-color: ${getColor("white")};
  border: 2px solid ${getColor("border")};
`;

export const ProductImage = styled.div`
  position: relative;
  border-radius: ${getSize(1)};
  height: ${getSize(19.2)};
  width: ${getSize(19.2)};
  border: 2px solid ${getColor("primary")};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  img {
    width: ${getSize(18)};
    height: ${getSize(18)};
  }

  img {
    border-radius: ${getSize(0.7)};
  }
`;

export const DeleteButton = styled.div`
  position: absolute;
  top: 10px;
  right: 40px;
  background-color: ${getColor("white")};
  border-radius: 50%;
  height: ${getSize(2.5)};
  width: ${getSize(2.5)};
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ChangeButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: ${getColor("white")};
  border-radius: 50%;
  height: ${getSize(2.5)};
  width: ${getSize(2.5)};
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const AddImage = styled.p`
  color: ${getColor("textDisabled")};
  font-size: ${getSize(1.5)};
  font-weight: 600;
  margin: 0;
`;

export const PremiumBadge = styled.div`
  padding: 0 ${getSize(0.8)};
  top: 70px;
  right: 30px;
  gap: ${getSize(0.6)};
  border-radius: ${getSize(2.0)};
  background-color: #FF730011;
  z-index: 2;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  ${responsive("laptop")} {
    top: 25px;
  }
`;

export const PremiumBadgeText = styled(Text)`
  font-size: ${getSize(1.3)};
  color: ${getColor("primary")};
  font-weight: 500;
`;
