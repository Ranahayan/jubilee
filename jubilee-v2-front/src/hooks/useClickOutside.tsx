import { useEffect } from "react";

const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) => {
  useEffect(() => {
    let startedInside = false;
    let startedWhenMounted: HTMLElement | null;

    const listener = (event: MouseEvent) => {
      if (startedInside || !startedWhenMounted) return;
      if (!ref.current || ref.current.contains(event.target as Node)) return;

      handler();
    };

    const validateEventStart = (event: MouseEvent | TouchEvent) => {
      startedWhenMounted = ref.current;
      startedInside = (ref.current &&
        ref.current.contains(event.target as Node)) as boolean;
    };

    document.addEventListener("mousedown", validateEventStart);
    document.addEventListener("touchstart", validateEventStart);
    document.addEventListener("click", listener);

    return () => {
      document.removeEventListener("mousedown", validateEventStart);
      document.removeEventListener("touchstart", validateEventStart);
      document.removeEventListener("click", listener);
    };
  }, [ref, handler]);
};

export default useClickOutside;
