import { useEffect, useMemo, useState, ReactNode, ReactElement } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: ReactNode;
  parent?: HTMLElement;
  className?: string;
}

export const Portal = ({ children, parent, className }: Props): ReactElement | null => {
  const [mounted, setMounted] = useState<boolean>(false);

  // Create div to contain everything
  const el = useMemo(() => document.createElement("div"), []);

  // On mount function
  useEffect(() => {
    // work out target in the DOM based on parent prop
    const target = parent || document.body;
    // Default classes
    const classList = ["portal-container"];
    // If className prop is present add each class to the classList
    if (className) className.split(" ").forEach(item => classList.push(item));
    classList.forEach(item => el.classList.add(item));

    // Append element to dom
    target.appendChild(el);

    // To ensure the portal is rendered only on the client side. Tweak for Next.js.
    setMounted(true);

    // On unmount function
    return () => {
      // Remove element from dom
      target.removeChild(el);
    };
  }, [el, parent, className]);

  // return the createPortal function
  return mounted ? createPortal(children, el) : null;
};