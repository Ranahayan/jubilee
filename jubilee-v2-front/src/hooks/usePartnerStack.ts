import { useEffect } from "react";

export const usePartnerStack = () => {
  const init = () => {
    const psKey = import.meta.env.VITE_PARTNERSTACK_KEY;
    if (!psKey) {
      console.warn("Partnerstack key not found");
      return;
    }
    const script = document.createElement("script");
    script.src = "https://snippet.growsumo.com/growsumo.min.js";
    script.async = true;
    // @ts-ignore
    script.onload = script.onreadystatechange = function () {
      // @ts-ignore
      const state = this.readyState;
      if (!state || state === "complete" || state === "loaded") {
        try {
          // @ts-ignore
          window.growsumo._initialize(psKey);
          // @ts-ignore
          if (typeof window.growsumoInit === "function") {
            // @ts-ignore
            window.growsumoInit();
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    return script;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pXID = searchParams.get("ps_xid");
    if (!pXID) return;
    localStorage.setItem("ps_xid", pXID);
  }, []);

  return { init, psXID: localStorage.getItem("ps_xid") };
};
