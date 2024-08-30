import { useEffect } from "react";
import { isDevelopment } from "~/helpers/environment";

export const useLeavePageWarning = () => {
  useEffect(() => {
    if (isDevelopment) return;

    window.addEventListener("beforeunload", alertUser);
    return () => {
      window.removeEventListener("beforeunload", alertUser);
    };
  }, []);

  const alertUser = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };
};
