import React from "react";
import { Navigate } from "react-router-dom";
import { getHasJWT } from "~/helpers/auth";

interface IProps {
  render: React.ReactNode;
  guest?: boolean;
  to?: string;
}

const RouteGuard: React.FC<IProps> = ({ render, guest = false, to }) => {
  const hasJWT = getHasJWT();

  if (guest ? !hasJWT : hasJWT) return <>{render}</>;
  if (!to) return null; // when implementing login, redirect to login, if "to" is not set
  return <Navigate to={{ pathname: to }} />;
};

export default RouteGuard;
