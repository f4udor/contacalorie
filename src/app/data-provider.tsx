"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createBrowserDataStore } from "@/data";
import type { DataStore } from "@/data";

const DataContext = createContext<DataStore | null>(null);

/** Lo sportello dei dati, creato nel browser dopo il caricamento (null finché non è pronto). */
export function useDataStore(): DataStore | null {
  return useContext(DataContext);
}

let clientStore: DataStore | null = null;
function getClientStore(): DataStore {
  clientStore ??= createBrowserDataStore();
  return clientStore;
}
const subscribeNever = () => () => {};

export function DataProvider({ children }: { children: ReactNode }) {
  // Sul server lo sportello non esiste; nel browser è uno solo per tutta l'app.
  const store = useSyncExternalStore(subscribeNever, getClientStore, () => null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    store?.getNotice().then(setNotice);
  }, [store]);

  return (
    <DataContext.Provider value={store}>
      {notice && (
        <div role="alert" className="mx-auto flex max-w-xl items-start justify-between gap-3 bg-warn-fill px-4 py-3 text-sm font-medium text-black">
          <span>{notice}</span>
          <button
            type="button"
            className="-my-2 -mr-2 min-h-11 min-w-11 rounded-full px-3 font-semibold"
            onClick={() => {
              store?.clearNotice();
              setNotice(null);
            }}
          >
            Ok
          </button>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
}
