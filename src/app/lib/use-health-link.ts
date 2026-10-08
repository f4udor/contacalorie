"use client";

import { useCallback, useEffect, useState } from "react";
import type { HealthLinkStatus } from "@/data";
import { useDataStore } from "../data-provider";

/** Stato del collegamento con Salute; null finché non si sa (o se la lettura non riesce). */
export function useHealthLink(): { link: HealthLinkStatus | null; reload: () => void } {
  const store = useDataStore();
  const [link, setLink] = useState<HealthLinkStatus | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!store) return;
    let alive = true;
    store.getHealthLink().then(
      (l) => alive && setLink(l),
      () => {
        // Lettura non riuscita: l'avviso in cima lo spiega.
      },
    );
    return () => {
      alive = false;
    };
  }, [store, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { link, reload };
}
