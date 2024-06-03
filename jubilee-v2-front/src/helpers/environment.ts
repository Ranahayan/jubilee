export const currentEnv: string = import.meta.env.VITE_ENV;
export const buildNumber: number = import.meta.env.VITE_BUILD_NUMBER;
export const googleGAKey: string = import.meta.env.VITE_GOOGLE_GA_KEY;
export const intercomKey: string = import.meta.env.VITE_INTERCOM_KEY;

export const isDevelopment: boolean = currentEnv === "development";
export const isStaging: boolean = currentEnv === "staging";
export const isProduction: boolean = currentEnv === "production";

export const datadogApplicationId: string =
  import.meta.env.VITE_DATADOG_APPLICATION_ID ?? "";
export const datadogClientToken: string =
  import.meta.env.VITE_DATADOG_CLIENT_TOKEN ?? "";
export const datadogSite: string = import.meta.env.VITE_DATADOG_SITE ?? "datadoghq.com";