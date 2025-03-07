import { createBrowserRouter } from "react-router-dom";
import { googleGAKey, isDevelopment } from "./environment";
import ReactGA from "react-ga4";

export const analyticsSetup = () => {
  if (isDevelopment) return;

  ReactGA.initialize(googleGAKey, {
    gaOptions: {
      allowLinker: true,
      cookieDomain: "auto",
    },
  });
};

export const getCreateRouter = () => {
  return createBrowserRouter;
};
