import { useGetStoreInfo } from "~/api/store/queries";
import { useQueryClient } from "@tanstack/react-query";
import { STORE } from "~/api/store/types";
import { useEffect } from "react";

export const useStore = () => {
  const queryClient = useQueryClient();
  const { data: store, isLoading, refetch } = useGetStoreInfo();

  const refreshStore = () => {
    return queryClient.invalidateQueries(STORE);
  };

  useEffect(() => {
    refreshStore();
  }, []);

  return { store, isLoading, refreshStore, refetch };
};
