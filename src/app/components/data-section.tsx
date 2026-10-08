"use client";

import { useState } from "react";
import { useDataStore } from "../data-provider";
import { downloadTextFile } from "../lib/download";
import { dishesCsv, measurementsCsv } from "../lib/export-csv";
import type { CsvFile } from "../lib/export-csv";
import { plural } from "../lib/plural";
import { useToday } from "../lib/use-today";
import { useAuth } from "../auth-provider";
import { ImportSection } from "./data-import";

const button = "min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent disabled:opacity-50";

/** Sezione "Dati" di Impostazioni: esportazione in CSV (browser o account) e, se serve, importazione. */
export function DataSection() {
  const store = useDataStore();
  const today = useToday();
  const { kind } = useAuth();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const run = async (name: string, build: (data: Awaited<ReturnType<NonNullable<typeof store>["exportAll"]>>) => CsvFile, empty: string, unit: [string, string]) => {
    if (!store || !today) return;
    setBusy(true);
    setStatus(null);
    try {
      const file = build(await store.exportAll());
      if (file.rows === 0) {
        setStatus(empty);
        return;
      }
      const filename = `${name}-${today}.csv`;
      downloadTextFile(filename, file.content);
      setStatus(`Scaricato ${filename}: ${plural(file.rows, unit[0], unit[1])}.`);
    } catch {
      // Lettura non riuscita: l'avviso in cima lo spiega.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-3 rounded-2xl bg-card p-4" aria-label="Dati">
      <h2 className="text-[22px] font-bold leading-tight">Dati</h2>
      <p className="mb-4 mt-1 text-sm text-muted">
        Scarica i tuoi dati in file CSV, che si aprono con Excel, Numbers o Fogli. {kind === "supabase" ? "Sono i dati del tuo account." : "Sono i dati salvati su questo dispositivo."}
      </p>
      <div className="flex flex-col gap-3">
        <button type="button" disabled={busy || !store} onClick={() => run("piatti", dishesCsv, "Non ci sono ancora piatti da esportare.", ["piatto", "piatti"])} className={button}>
          Esporta i piatti (CSV)
        </button>
        <button type="button" disabled={busy || !store} onClick={() => run("pesate-e-attivita", measurementsCsv, "Non ci sono ancora pesate o attività da esportare.", ["giorno", "giorni"])} className={button}>
          Esporta pesate e attività (CSV)
        </button>
        {status && (
          <p role="status" className="text-sm font-medium text-muted">
            {status}
          </p>
        )}
      </div>
      {kind !== null && (
        <div className="mt-4 border-t border-line pt-4 empty:hidden">
          <ImportSection />
        </div>
      )}
    </section>
  );
}
