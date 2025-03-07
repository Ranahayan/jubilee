import { datadogRum } from "@datadog/browser-rum";
import { datadogLogs } from "@datadog/browser-logs";
import {
  currentEnv,
  buildNumber,
  datadogApplicationId,
  datadogClientToken,
  datadogSite,
  isDevelopment,
} from "./environment";

const DATADOG_SERVICE = import.meta.env.VITE_DATADOG_SERVICE;
const SLOW_API_REQUEST_MS = 1500;
let datadogInitialized = false;

const getVersion = () => String(buildNumber || "0");
const getDatadogEnv = () => {
  const version = getVersion();
  if (version.startsWith("staging-")) return "staging";
  if (version.startsWith("prod-")) return "production";
  return currentEnv || "production";
};
const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const normalizeError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "Unknown error" };
};

const isDatadogEnabled = () =>
  !isDevelopment && Boolean(datadogApplicationId) && Boolean(datadogClientToken);

const registerGlobalErrorHandlers = () => {
  window.addEventListener("error", (event) => {
    const normalizedError = normalizeError(event.error ?? event.message);

    datadogLogs.logger.error("Unhandled runtime error", {
      source: "window.error",
      message: normalizedError.message,
      stack: normalizedError.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    datadogRum.addError(event.error ?? normalizedError.message, {
      source: "window.error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const normalizedError = normalizeError(event.reason);

    datadogLogs.logger.error("Unhandled promise rejection", {
      source: "window.unhandledrejection",
      message: normalizedError.message,
      stack: normalizedError.stack,
    });

    datadogRum.addError(event.reason ?? normalizedError.message, {
      source: "window.unhandledrejection",
    });
  });
};

/**
 * Initializes Datadog Browser RUM when credentials are set and not in development.
 * Call this once at app startup (e.g. from main.tsx in a non-blocking callback).
 */
export const initDatadogRum = () => {
  if (datadogInitialized || !isDatadogEnabled()) return;
  datadogInitialized = true;
  const datadogEnv = getDatadogEnv();
  const datadogVersion = getVersion();

  datadogLogs.init({
    clientToken: datadogClientToken,
    site: datadogSite,
    service: DATADOG_SERVICE,
    env: datadogEnv,
    version: datadogVersion,
    forwardErrorsToLogs: false,
    sessionSampleRate: 100,
  });

  datadogRum.init({
    applicationId: datadogApplicationId,
    clientToken: datadogClientToken,
    site: datadogSite,
    service: DATADOG_SERVICE,
    env: datadogEnv,
    version: datadogVersion,
    sessionSampleRate: 50,
    sessionReplaySampleRate: 0,
    trackResources: false,
    trackLongTasks: true,
    trackUserInteractions: false,
  });

  // Temporary runtime marker to verify effective Datadog tags in RUM Explorer.
  datadogRum.addAction("dd_boot_config", {
    env: datadogEnv,
    service: DATADOG_SERVICE,
    version: datadogVersion,
  });

  registerGlobalErrorHandlers();
};

type ApiLogPayload = {
  method?: string;
  url?: string;
  status?: number;
  durationMs: number;
  errorMessage?: string;
};

export const trackApiRequest = ({
  method,
  url,
  status,
  durationMs,
  errorMessage,
}: ApiLogPayload) => {
  if (!datadogInitialized) return;

  const payload = {
    method: (method || "UNKNOWN").toUpperCase(),
    url: (url || "").split("?")[0],
    status: status ?? 0,
    duration_ms: Math.round(durationMs),
  };

  datadogRum.addAction("api_request", payload);

  const isServerError = payload.status >= 500 || payload.status === 0;
  const isClientError = payload.status >= 400 && payload.status < 500;
  const isSlowRequest = payload.duration_ms >= SLOW_API_REQUEST_MS;

  if (isServerError || (payload.status === 0 && errorMessage)) {
    datadogLogs.logger.error("API request failed", {
      ...payload,
      error_message: errorMessage || "Unknown API error",
    });
    return;
  }

  if (isClientError) {
    datadogLogs.logger.warn("API client error", payload);
    return;
  }

  if (isSlowRequest) {
    datadogLogs.logger.warn("Slow API request", payload);
  }
};

export const trackWebVital = (name: string, value: number, rating: string) => {
  if (!datadogInitialized) return;

  const payload = { name, value: Number(value.toFixed(2)), rating };
  datadogRum.addAction("web_vital", payload);

  if (rating === "poor") {
    datadogLogs.logger.warn("Poor web vital detected", payload);
  }
};

/**
 * Log a caught error or message to Datadog (Logs + RUM). Use in try/catch or
 * when you want to track a business/feature failure without throwing.
 */
export const logError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
) => {
  if (!datadogInitialized) return;

  const normalized = error !== undefined ? normalizeError(error) : null;
  const payload = {
    ...context,
    message,
    ...(normalized && {
      error_message: normalized.message,
      stack: normalized.stack,
    }),
  };

  datadogLogs.logger.error(message, payload);
  datadogRum.addError(error ?? message, { ...context, custom: true });
};

type LogContext = Record<string, unknown>;

/**
 * Send a log entry to Datadog Logs (when Datadog is initialized).
 * Use throughout the project for operational and feature logs.
 *
 * @example
 * import { log } from "~/helpers/datadog";
 * log.info("Checkout started", { planId: "yearly" });
 * log.warn("Payment retry", { attempt: 2 });
 * log.error("Checkout failed", error, { step: "payment" });
 */
export const log = {
  info: (message: string, context?: LogContext) => {
    if (!datadogInitialized) return;
    datadogLogs.logger.info(message, context ?? {});
  },
  warn: (message: string, context?: LogContext) => {
    if (!datadogInitialized) return;
    datadogLogs.logger.warn(message, context ?? {});
  },
  error: (
    message: string,
    error?: unknown,
    context?: LogContext
  ) => {
    if (!datadogInitialized) return;
    const normalized = error !== undefined ? normalizeError(error) : null;
    datadogLogs.logger.error(message, {
      ...context,
      ...(normalized && {
        error_message: normalized.message,
        stack: normalized.stack,
      }),
    });
  },
  debug: (message: string, context?: LogContext) => {
    if (!datadogInitialized) return;
    datadogLogs.logger.debug(message, context ?? {});
  },
};

export const getNow = now;