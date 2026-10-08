"use client";

import { useRef, useState } from "react";
import { createMemoryDataStore } from "@/data";
import type { DataStore } from "@/data";
import { useAuth } from "../auth-provider";
import { useDataStore } from "../data-provider";
import { useLocalData } from "../lib/use-local-data";
import { plural } from "../lib/plural";
import { summarize } from "@/data";
import { ImportSheet } from "./import-sheet";

/**
 * L'archivio in cui importare: quello dell'account (Supabase). Nella modalità dimostrativa dell'accesso (solo per gli
 * screenshot) l'app non ha un account vero e si usa un archivio finto in memoria.
 */
function useImportTarget(): DataStore | null {
  const { kind } = useAuth();
  const appStore = useDataStore();
  const demo = useRef<DataStore | null>(null);
  if (kind === "demo") return (demo.current ??= createMemoryDataStore());
  return kind === "supabase" ? appStore : null;
}

/** Al primo accesso, se su questo dispositivo ci sono dati, propone di importarli. */
export function ImportPrompt() {
  const { kind } = useAuth();
  const target = useImportTarget();
  const { data, reload } = useLocalData(kind !== null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !data || !target) return null;
  return <ImportSheet local={data} remote={target} onClose={() => setDismissed(true)} onLocalCleared={reload} />;
}

/** Voce "Importa i dati di questo dispositivo" in Impostazioni, visibile solo se ci sono dati da importare. */
export function ImportSection() {
  const { kind } = useAuth();
  const target = useImportTarget();
  const { data, reload } = useLocalData(kind !== null);
  const [open, setOpen] = useState(false);
  if (!data || !target) return null;
  const s = summarize(data);
  return (
    <>
      <p className="text-sm text-muted">
        Su questo dispositivo ci sono dati salvati prima dell&apos;accesso: {plural(s.days, "giorno", "giorni")}, {plural(s.dishes, "piatto", "piatti")}, {plural(s.weighIns, "pesata", "pesate")}.
      </p>
      <button type="button" onClick={() => setOpen(true)} className="mt-3 min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent">
        Importa i dati di questo dispositivo
      </button>
      {open && <ImportSheet local={data} remote={target} onClose={() => setOpen(false)} onLocalCleared={reload} />}
    </>
  );
}
