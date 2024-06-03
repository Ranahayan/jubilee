import { AxiosResponse } from "axios";

export const getAPIData = <T = any>(promise: Promise<AxiosResponse<T>>) => {
  return promise.then((res) => {
    if (!res || !res.data) {
      return Promise.reject("No data");
    }
    return res.data;
  });
};
