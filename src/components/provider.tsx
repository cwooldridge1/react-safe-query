import React, { ReactNode, createContext } from "react";
import { type QueryClient } from '@tanstack/react-query'
import { ReactSafeQueryContextProps } from "../types";

export const ReactSafeQueryContext = createContext({} as ReactSafeQueryContextProps);

export const ReactSafeQueryProvider = ({ queryClient, children }: { queryClient: QueryClient, children: ReactNode }) => {

  return (
    <ReactSafeQueryContext.Provider value={{ queryClient }}>
      {children}
    </ReactSafeQueryContext.Provider>
  )
}


