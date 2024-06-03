import { QueryKey } from "@tanstack/react-query";
import { queryClient } from "~/contexts/ReactQuery";

export const addToArr =
  (data: Array<any>) =>
  (prevData: Array<any>): Array<any> =>
    [...prevData, data];
export const updateUsingID =
  (data: Array<any>) =>
  (prevData: Array<any>): Array<any> =>
    // @ts-ignore
    [...prevData.map((item) => (item.id !== data?.id ? item : data))];
export const deleteUsingID =
  (data: Array<any>) =>
  (prevData: Array<any>): Array<any> =>
    // @ts-ignore
    [...prevData.filter((item) => data && data.id !== item.id)];

export const mutate = (type: QueryKey, queryData: any) => {
  queryClient.cancelQueries(type);
  queryClient.setQueryData(type, queryData);
};
