import { ReactNode, ReactPortal, useEffect } from "react";
import { ReactQueryProvider } from "./ReactQuery";
import { AccountProvider } from "./Account";
import { StoreProvider } from "./Store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { usePartnerStack } from "~/hooks/usePartnerStack";
import { useUTM } from "~/hooks/useUTM";

type Props = {
  children: ReactNode | ReactPortal;
};

export const ContextWrapper = ({ children }: Props) => {
  const { init } = usePartnerStack();
  useUTM();

  useEffect(() => {
    const script = init();
    if (!script) return;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH_ID}>
      <AccountProvider>
        <StoreProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </StoreProvider>
      </AccountProvider>
    </GoogleOAuthProvider>
  );
};
