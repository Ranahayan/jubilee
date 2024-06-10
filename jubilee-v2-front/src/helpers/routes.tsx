import React, { Suspense } from "react";

import { paths } from "~/router/paths";
import {
  PageWrapper,
  PageWrapperFullScreen,
} from "~/components/layout/PageWrapper";
import RouteGuard from "~/components/layout/RouteGuard";

import { Navigate } from "react-router-dom";
import { redirectRoutes } from "~/router/redirects";
import Sidebar from "~/components/layout/Sidebar";
import SuspenseFallback from "~/components/layout/SuspenseFallback";
import { PlansModal } from "~/components/plans/plansModal";

export const makeRedirects = () => {
  return redirectRoutes.map(({ path, to }) => ({
    path,
    element: <Navigate to={to} />,
  }));
};

export const app = (Component: React.FC<any>, pathname?: string) => {
  // Auth Guard (must be logged in)
  return (
    <RouteGuard
      to={paths.auth.login}
      render={
        <>
          <Sidebar />
          <Suspense fallback={<SuspenseFallback />}>
            <PageWrapper>
              <Component key={pathname} />
            </PageWrapper>
          </Suspense>
        </>
      }
    />
  );
};

export const guest = (Component: React.FC<any>) => {
  // Login/Register Guard (if logged in, redirect to home)
  return <RouteGuard guest to={paths.app.home} render={<Component />} />;
};

export const fullscreen = (Component: React.FC<any>) => {
  // Auth Guard (must be logged in)
  return (
    <RouteGuard
      to={paths.auth.login}
      render={
        <PageWrapperFullScreen>
          <Component />
        </PageWrapperFullScreen>
      }
    />
  );
};
