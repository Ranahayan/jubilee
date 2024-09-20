import styled from "styled-components";
import {
  getBorderRadius,
  getColor,
  getProperty,
  getShadow,
  getSize,
} from "~/helpers/style";

export const Container = styled.div`
  margin: ${getSize(0)} 0;
  padding: ${(props) => getSize(getProperty("padding", 1.5)(props))};
  background-color: ${(props) =>
    getColor(getProperty("bgColor", "backgroundSecondary")(props))};
  display: flex;
  flex-direction: ${getProperty("flexDirection", "row")};
  gap: ${(props) => getSize(getProperty("gap", 1)(props))};
  justify-content: ${getProperty("justifyContent", "center")};
  align-items: ${getProperty("alignItems", "center")};
  align-content: ${getProperty("alignContent", "initial")};
  flex-wrap: ${getProperty("flexWrap", "initial")};
  width: ${getProperty("width", "initial")};

  height: ${getProperty("height", "auto")};
  border-radius: ${getBorderRadius(0.5)};
  box-shadow: ${getShadow()};
`;
