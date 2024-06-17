import React, { useState } from "react";

import { createContext } from "react";
import { IStore } from "~/types/store";

interface IStoreContextProps {
  store: IStore | null;
  setStore: React.Dispatch<React.SetStateAction<IStore | null>>;
}

export const StoreContext = createContext<IStoreContextProps>({
  store: null,
  setStore: () => {},
});

interface IProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<IProps> = ({ children }) => {
  const [store, setStore] = useState<IStore | null>(null);

  return (
    <StoreContext.Provider value={{ store, setStore }}>
      {children}
    </StoreContext.Provider>
  );
};
