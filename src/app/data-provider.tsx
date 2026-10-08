"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createBrowserDataStore } from "@/data";
import type { DataStore } from "@/data";

interface DataValue {
  store: DataStore | null;
  notice: string | null;
  dismissNotice: () => void;
}

const DataContext = createContext<DataValue>({ store: null, notice: null, dismissNotice: () => {} });

/** Lo sportello dei dati, creato nel browser dopo il caricamento (null finché non è pronto). */
export function useDataStore(): DataStore | null {
  return useContext(DataContext).store;
}

/** Messaggio sullo stato dei dati salvati (illeggibili, non salvabili) e modo per chiuderlo. */
export function useDataNotice() {
  const { notice, dismissNotice } = useContext(DataContext);
  return { notice, dismissNotice };
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

  const dismissNotice = () => {
    store?.clearNotice();
    setNotice(null);
  };

  return <DataContext.Provider value={{ store, notice, dismissNotice }}>{children}</DataContext.Provider>;
}
