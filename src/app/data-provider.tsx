"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createDataStore, withErrorReporting } from "@/data";
import type { DataStore, ErrorReport } from "@/data";

/** Un problema da mostrare in cima: dati illeggibili al caricamento, oppure una lettura o un salvataggio non riusciti. */
export interface DataProblem {
  text: string;
  /** "lettura": si può ricaricare la pagina; "scrittura": si riprova l'azione che non è riuscita. */
  kind: "avviso" | "lettura" | "scrittura" | "accesso";
}

interface DataValue {
  store: DataStore | null;
  problem: DataProblem | null;
  dismissProblem: () => void;
}

const DataContext = createContext<DataValue>({ store: null, problem: null, dismissProblem: () => {} });

/** Lo sportello dei dati, creato nel browser dopo il caricamento (null finché non è pronto). */
export function useDataStore(): DataStore | null {
  return useContext(DataContext).store;
}

/** Il problema da mostrare in cima (se c'è) e il modo per chiuderlo. */
export function useDataProblem() {
  const { problem, dismissProblem } = useContext(DataContext);
  return { problem, dismissProblem };
}

// Lo sportello è uno solo per tutta l'app; gli errori arrivano al componente tramite questa funzione.
let report: (r: ErrorReport) => void = () => {};
let clientStore: DataStore | null = null;
function getClientStore(): DataStore {
  clientStore ??= withErrorReporting(createDataStore(), (r) => report(r));
  return clientStore;
}
const subscribeNever = () => () => {};

export function DataProvider({ children }: { children: ReactNode }) {
  // Sul server lo sportello non esiste; nel browser è uno solo per tutta l'app.
  const store = useSyncExternalStore(subscribeNever, getClientStore, () => null);
  const [problem, setProblem] = useState<DataProblem | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    report = (r) => alive.current && setProblem({ text: r.message, kind: r.kind });
    store?.getNotice().then((notice) => {
      if (alive.current && notice) setProblem({ text: notice, kind: "avviso" });
    }).catch(() => {});
    return () => {
      alive.current = false;
      report = () => {};
    };
  }, [store]);

  const dismissProblem = () => {
    if (problem?.kind === "avviso") store?.clearNotice();
    setProblem(null);
  };

  return <DataContext.Provider value={{ store, problem, dismissProblem }}>{children}</DataContext.Provider>;
}
