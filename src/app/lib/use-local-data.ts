"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserDataStore, isEmptyData } from "@/data";
import type { StoredData } from "@/data";

/**
 * I dati salvati su questo dispositivo (nel browser), se ce ne sono. `enabled` dice se interessano
 * (solo con l'accesso attivo). `reload` rilegge, per esempio dopo averli tolti.
 */
export function useLocalData(enabled: boolean): { data: StoredData | null; loaded: boolean; reload: () => void } {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ data: StoredData | null; loaded: boolean }>({ data: null, loaded: false });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    createBrowserDataStore()
      .exportAll()
      .then((d) => alive && setState({ data: isEmptyData(d) ? null : d, loaded: true }))
      .catch(() => alive && setState({ data: null, loaded: true }));
    return () => {
      alive = false;
    };
  }, [enabled, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
