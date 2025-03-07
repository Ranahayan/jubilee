import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { useEffect } from "react";

export const usePageViews = () => {
  let location = useLocation();
  useEffect(() => {
    ReactGA.send(location.pathname + location.search);
  }, [location]);
};
