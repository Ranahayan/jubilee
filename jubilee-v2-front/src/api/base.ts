import axiosLib, { AxiosError, AxiosRequestConfig } from "axios";
import { refreshToken } from "~/api/account/requests";
import { MaxRetriesError } from "~/helpers/errors";
import {
  getJWT,
  setJWT,
  getRefreshToken,
  setRefreshToken,
} from "~/helpers/auth";
import { paths } from "~/router/paths";
import { excludePaths } from "~/constants/paths";
import { endpointsToExcludeTheJWT } from "~/api/constants";
import { getNow, trackApiRequest } from "~/helpers/datadog";

const apiURL: string = import.meta.env.VITE_API_URL;

export const axios = axiosLib.create({
  timeout: 60000,
});

const getURL = (path: string) =>
  `${apiURL}/${path.endsWith("/") ? path : path + "/"}`;

type DatadogAxiosConfig = AxiosRequestConfig & {
  metadata?: {
    requestStartTime: number;
  };
};

const getRequestDuration = (config?: AxiosRequestConfig) => {
  const requestStartTime = (config as DatadogAxiosConfig | undefined)?.metadata
    ?.requestStartTime;

  if (!requestStartTime) return 0;
  return getNow() - requestStartTime;
};

const handleRequest = (config: AxiosRequestConfig): any => {
  (config as DatadogAxiosConfig).metadata = { requestStartTime: getNow() };
  const isAuthEndpoint = endpointsToExcludeTheJWT.find((endpoint) =>
    config.url?.includes(endpoint)
  );
  const isS3Endpoint = config.url?.includes("s3.amazonaws.com");

  if (isS3Endpoint || isAuthEndpoint) {
    return config;
  }

  const jwt = getJWT();
  if (jwt && config.headers) config.headers.Authorization = `Bearer ${jwt}`;
  return config;
};

axios.interceptors.request.use(handleRequest);

axios.interceptors.response.use(
  (response) => {
    trackApiRequest({
      method: response.config.method,
      url: response.config.url,
      status: response.status,
      durationMs: getRequestDuration(response.config),
    });

    return response;
  },
  (error: AxiosError) => {
    trackApiRequest({
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      durationMs: getRequestDuration(error.config),
      errorMessage: error.message,
    });

    return Promise.reject(error);
  }
);

export const forceSignOut = () => {
  if (
    excludePaths.find((path) => new RegExp(path).test(window.location.pathname))
  ) {
    return; // Prevent sign out on pages where the user is not logged in.
  }

  setJWT("");
  setRefreshToken("");
  window.location.href = paths.auth.login;
};

const handleErrorWrapper = async <T = any>(
  next: Function,
  retries: number = 5
): Promise<T | void> => {
  if (retries <= 0) {
    throw new MaxRetriesError("Max retries reached");
  }

  try {
    return await next();
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      if (err.response) {
        const { status } = err.response;
        const refresh = getRefreshToken();

        if (status === 402) {
          localStorage.setItem("plansModal", "true");
        }

        if (status === 401) {
          if (refresh) {
            if (err?.config?.url?.includes("/token/refresh/")) {
              return forceSignOut();
            }

            try {
              const res = await refreshToken({ refresh });
              setJWT(res?.data?.access);
            } catch {
              return forceSignOut();
            }

            return handleErrorWrapper(next, retries - 1);
          } else if (!err?.config?.url?.includes("/auth/")) {
            return forceSignOut();
          }
        }
      }
    }
    return Promise.reject(err);
  }
};

export const sendGet = async (path: string, params?: Object): Promise<any> => {
  return handleErrorWrapper(async () => {
    return axios.get(getURL(path), { params });
  });
};

export const sendPost = async (path: string, params?: Object) => {
  return handleErrorWrapper(async () => {
    return axios.post(getURL(path), params);
  });
};

export const sendPut = async (path: string, params?: Object) => {
  return handleErrorWrapper(async () => {
    return axios.put(getURL(path), params);
  });
};

export const sendDelete = async (path: string, params: Object) => {
  return handleErrorWrapper(async () => {
    return axios.delete(getURL(path), params);
  });
};
