import React, { useState } from "react";

import { createContext } from "react";
import { IAccount } from "~/types/account";

interface IAccountContextProps {
  account: IAccount | null;
  setAccount: React.Dispatch<React.SetStateAction<IAccount | null>>;
}

export const AccountContext = createContext<IAccountContextProps>({
  account: null,
  setAccount: () => {},
});

interface IProps {
  children: React.ReactNode;
}

export const AccountProvider: React.FC<IProps> = ({ children }) => {
  const [account, setAccount] = useState<IAccount | null>(null);

  return (
    <AccountContext.Provider value={{ account, setAccount }}>
      {children}
    </AccountContext.Provider>
  );
};
