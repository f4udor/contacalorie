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
import { ActionRow, Caption, GroupedList } from "./ui/ui";

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
    <section className="flex flex-col gap-1.5" aria-label="Dati">
      <GroupedList>
        <ActionRow label="Esporta i piatti (CSV)" disabled={busy || !store} onClick={() => run("piatti", dishesCsv, "Non ci sono ancora piatti da esportare.", ["piatto", "piatti"])} />
        <ActionRow label="Esporta pesate e attività (CSV)" disabled={busy || !store} onClick={() => run("pesate-e-attivita", measurementsCsv, "Non ci sono ancora pesate o attività da esportare.", ["giorno", "giorni"])} />
      </GroupedList>
      <Caption>{kind === "supabase" ? "File CSV con i dati del tuo account." : "File CSV con i dati di questo dispositivo."}</Caption>
      {status && <p role="status" className="px-4 text-[13px] text-testo-secondario">{status}</p>}
      {kind !== null && (
        <div className="mt-4 flex flex-col gap-1.5 empty:hidden">
          <ImportSection />
        </div>
      )}
    </section>
  );
}
