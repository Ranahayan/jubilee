import { RefObject, useCallback, useEffect, useState } from "react";
import useClickOutside from "./useClickOutside";

export const useDropdown = (containerRef: RefObject<HTMLElement>) => {
  const [dropdownSide, setDropdownSide] = useState<null | "left" | "right">(
    null
  );

  const calculateDropdownSide = () => {
    if (!containerRef.current) return null;

    const { x: containerX } = containerRef.current.getBoundingClientRect();

    if (containerX < window.innerWidth / 2) return "left";

    return "right";
  };

  useEffect(() => {
    const listener = () => {
      if (dropdownSide === null) return;

      setDropdownSide(calculateDropdownSide());
    };

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [dropdownSide]);

  useClickOutside(containerRef, () => setDropdownSide(null));

  const toggleDropdown = useCallback(() => {
    setDropdownSide((prev) => (prev === null ? calculateDropdownSide() : null));
  }, []);

  const closeDropdown = useCallback(() => setDropdownSide(null), []);

  return { dropdownSide, toggleDropdown, closeDropdown } as const;
};
