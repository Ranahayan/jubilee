import styled from "styled-components";
import { getProperty, getSize } from "~/helpers/style";

export const Container = styled.div`
  display: flex;
  flex-direction: ${getProperty("flexDirection", "row")};
  gap: ${(props) => getSize(getProperty("gap", 1)(props))};
  justify-content: ${getProperty("justifyContent", "center")};
  align-items: ${getProperty("alignItems", "center")};
  align-content: ${getProperty("alignContent", "initial")};
  flex-wrap: ${getProperty("flexWrap", "initial")};
  width: ${getProperty("width", "initial")};
  height: ${getProperty("height", "initial")};
  padding: ${getProperty("padding", "initial")};
`;
