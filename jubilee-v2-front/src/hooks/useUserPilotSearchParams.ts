
import { useEffect } from "react";
import { Userpilot } from "userpilot";

const handleSearchParamUpdate = (show: boolean, id: string | undefined) => {
  if (!id) return;

  const searchParams = new URLSearchParams(window.location.search);
  const cleanSearchParams = () => searchParams.delete(id);

  if (show) {
    searchParams.set(id, "true");
  } else {
    cleanSearchParams();
  }

  const queryParams = searchParams.toString();
  const newUrl = window.location.pathname + (!!queryParams ? `?${queryParams}` : "");
  window.history.replaceState(null, "", newUrl);
  Userpilot.reload();

  return cleanSearchParams;
}

export const useUserPilotSearchParams = (id: string | undefined, isShowing: boolean) => {
  useEffect(() => {
    if (!id) return;
    return handleSearchParamUpdate(isShowing, id);
  }, [isShowing]);

  return handleSearchParamUpdate;
}