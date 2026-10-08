"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserSettings, WeighIn } from "@/data";
import { useDataStore } from "../data-provider";

/** Impostazioni salvate e pesate; `reload` le rilegge dopo una modifica. null finché non sono pronte. */
export function useUserSettings(): { loaded: { settings: UserSettings; weighIns: WeighIn[] } | null; reload: () => void } {
  const store = useDataStore();
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<{ settings: UserSettings; weighIns: WeighIn[] } | null>(null);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    Promise.all([store.getSettings(), store.listWeighIns()])
      .then(([settings, weighIns]) => {
        if (!cancelled) setLoaded({ settings, weighIns });
      })
      .catch(() => {
        // Lettura non riuscita: l'avviso in cima lo spiega.
      });
    return () => {
      cancelled = true;
    };
  }, [store, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { loaded, reload };
}
