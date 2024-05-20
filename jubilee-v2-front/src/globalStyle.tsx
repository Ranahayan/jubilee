import { createGlobalStyle } from "styled-components";
import { getBorderRadius, getColor } from "./helpers/style";

const GlobalStyle = createGlobalStyle`
:root {
    font-family: 'Inter Variable';
    font-size: 16px;
    line-height: 150%;
    font-weight: 400;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
    letter-spacing: 0.005em;
    color: ${getColor("text")};
}

* {
  box-sizing: border-box;
  font-family: 'Inter Variable';
}
  
body, #app {
    margin: 0;
    display: block;
    min-width: 320px;
    min-height: 100vh;
    background-color: ${getColor("background")};
}

/* Width and height of the scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/* Track */
::-webkit-scrollbar-track {
  background: ${getColor("borderSecondary")};
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: ${getColor("disabled")};
  border-radius: ${getBorderRadius(0.75)};
}

#payment-element {
  width: 100%;
}
`;

export default GlobalStyle;
