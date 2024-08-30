import { useTheme } from "styled-components";
import { IThemeBreakpoints } from "../types/theme";
import _get from "lodash/get";
import _debounce from "lodash/debounce";
import { useEffect, useState } from "react";

export const useMediaQuery = (
  device: keyof IThemeBreakpoints,
  defaultValue?: boolean
) => {
  const [matches, setMatches] = useState<boolean>(
    defaultValue !== undefined ? defaultValue : false
  );
  const theme = useTheme();
  const breakpoint = _get(theme, `breakpoints.${device}`);

  useEffect(() => {
    const check = () => {
      if (breakpoint) {
        const mediaQuery = window.matchMedia(`(min-width: ${breakpoint})`);
        if (mediaQuery.matches !== matches) setMatches(mediaQuery.matches);
      }
    };
    check();

    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
    };
  }, [matches]);

  return matches;
};
