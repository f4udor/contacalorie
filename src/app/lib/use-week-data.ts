"use client";

import { useCallback, useEffect, useState } from "react";
import type { DateKey } from "@/engine";
import { useDataStore } from "../data-provider";
import { useToday } from "./use-today";
import { loadWeekData } from "./week-data";
import type { WeekData } from "./week-data";

/** Carica la settimana che contiene `date`; `reload` rilegge dopo una modifica. null finché non è pronta. */
export function useWeekData(date: DateKey | null): { data: WeekData | null; reload: () => void } {
  const store = useDataStore();
  const today = useToday();
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<{ date: DateKey; data: WeekData } | null>(null);

  useEffect(() => {
    if (!store || !date) return;
    let cancelled = false;
    loadWeekData(store, date, today ?? date)
      .then((data) => {
        if (!cancelled) setLoaded({ date, data });
      })
      .catch(() => {
        // Lettura non riuscita: l'avviso in cima lo spiega.
      });
    return () => {
      cancelled = true;
    };
  }, [store, date, today, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: loaded && loaded.date === date ? loaded.data : null, reload };
}
