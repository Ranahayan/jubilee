import styled from "styled-components";
import { getColor, getSize } from "~/helpers/style";
import Button from "../ui/Button";

export const ModalTitle = styled.h2`
  color: ${getColor("text")};
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: 160%; /* 35.2px */
  margin: 0;
  text-align: center;
`;

export const ModalDescription = styled.h3`
  color: ${getColor("textDisabled")};
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 160%; /* 35.2px */
  margin: 0;
  text-align: center;
`;

export const RatingsContainer = styled.div`
  margin-top: ${getSize(2.4)};
  display: flex;
  justify-content: space-between;
  width: 100%;
  flex-direction: row;
  margin-bottom: ${getSize(2.4)};
`;

export const FeedbackTextArea = styled.textarea`
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: ${getColor("background")};
  padding: ${getSize(2.2)};
  width: 100%;
  margin-bottom: ${getSize(2.4)};
  min-height: ${getSize(16.6)};
  resize: none;
`;

export const ShopifyTitle = styled.h2`
  color: ${getColor("text")};
  font-size: 22px;
  font-style: normal;
  font-weight: 600;
  margin-top: ${getSize(1.5)};
  margin-bottom: 0;
`;

export const ShopifyDescription = styled.p`
  color: ${getColor("textDisabled")};
  text-align: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 185%;
  margin-top: ${getSize(1)};
  margin-bottom: ${getSize(3)};
`;

export const ShopifyWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export const DoItLaterButton = styled.button`
  border: none;
  background-color: ${getColor("primary")}33;
  border-radius: ${getSize(0.8)};
  margin-top: ${getSize(2.4)};
  font-weight: 500;
  width: 100%;
  height: 44px;
  color: ${getColor("primary")};
  font-size: 16px;
  cursor: pointer;
`;

export const SubmitButton = styled.button`
  border: none;
  background-color: ${getColor("primary")};
  border-radius: ${getSize(0.8)};
  margin-top: ${getSize(2.4)};
  font-weight: 500;
  width: 100%;
  height: 44px;
  color: ${getColor("white")};
  font-size: 16px;
  cursor: pointer;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 600px;
`;

export const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  & > svg {
    width: ${getSize(2)};
    height: ${getSize(2)};
  }

  & > svg > circle {
    stroke: ${getColor("white")};
  }
`;