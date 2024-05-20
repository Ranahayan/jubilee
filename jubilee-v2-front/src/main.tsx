import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";

import { ThemeProvider } from "styled-components";
import theme from "~/constants/theme";

import GlobalStyle from "~/globalStyle";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/inter/wght-italic.css";
import { ToastContainer } from "~/components/toast";

import { routes } from "~/router/routes";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "~/translations/i18n";

import { analyticsSetup, getCreateRouter } from "./helpers/analytics";
import { intercomKey } from "./helpers/environment";
import { ContextWrapper } from "./contexts";
import tagManagerSetup from "./helpers/tagManagerSetup";
import SuspenseFallback from "~/components/layout/SuspenseFallback";
import { initDatadogRum } from "./helpers/datadog";

if (typeof window !== "undefined") {
  analyticsSetup();
  tagManagerSetup();
  initDatadogRum();
}

const createRouter = getCreateRouter();
const router = createRouter(routes);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <IntercomProvider
      appId={intercomKey}
      autoBoot={false}
      apiBase={
        intercomKey
          ? `https://${intercomKey}.intercom-messenger.com`
          : undefined
      }
    >
      <ContextWrapper>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <Suspense fallback={<SuspenseFallback />}>
            <RouterProvider router={router} />
          </Suspense>
          <ToastContainer />
          <ReactQueryDevtools initialIsOpen={false} />
        </ThemeProvider>
      </ContextWrapper>
    </IntercomProvider>
  </React.StrictMode>
);
