"use client";

import { useState } from "react";
import { clearBrowserData, importLocalData, normalizeFreeFlags, summarize } from "@/data";
import type { DataStore, ImportResult, StoredData } from "@/data";
import { plural } from "../lib/plural";
import { Sheet } from "./sheet";

interface Props {
  /** I dati di questo dispositivo da importare. */
  local: StoredData;
  /** L'archivio dell'account in cui importarli. */
  remote: DataStore;
  onClose: () => void;
  /** Chiamata dopo aver tolto i dati dal dispositivo. */
  onLocalCleared: () => void;
}

const primary = "min-h-12 w-full rounded-xl py-3 bg-accent px-4 text-[17px] font-semibold text-white disabled:opacity-50";
const neutral = "min-h-12 w-full rounded-xl py-3 bg-bg px-4 text-[17px] font-semibold text-accent disabled:opacity-50";
const danger = "min-h-12 w-full rounded-xl py-3 bg-bad-fill px-4 text-[17px] font-semibold text-white disabled:opacity-50";

/** Importazione dei dati di questo dispositivo nell'account, con conferma prima di toglierli dal dispositivo. */
export function ImportSheet({ local, remote, onClose, onLocalCleared }: Props) {
  const [stage, setStage] = useState<"proponi" | "fatto" | "conferma">("proponi");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const s = summarize(local);
  const mixedFree = normalizeFreeFlags(local.meals).changedMeals;

  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      setResult(await importLocalData(local, remote));
      setStage("fatto");
    } catch {
      setFailed(true); // l'avviso in cima dice cosa è successo; quello già importato non si duplica se si riprova
    } finally {
      setBusy(false);
    }
  };

  const clearLocal = () => {
    clearBrowserData();
    onLocalCleared();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={stage === "conferma" ? "Togliere i dati?" : "Importa i dati di questo dispositivo"}>
      {stage === "proponi" && (
        <div className="flex flex-col gap-4">
          <p className="text-[17px]">
            Su questo dispositivo ci sono dati salvati prima dell&apos;accesso: <strong>{plural(s.days, "giorno", "giorni")}</strong>, <strong>{plural(s.dishes, "piatto", "piatti")}</strong>,{" "}
            <strong>{plural(s.weighIns, "pesata", "pesate")}</strong>.
          </p>
          <p className="text-[15px] text-muted">
            Importandoli finiscono nel tuo account e li vedi anche dagli altri dispositivi. Se li hai già importati, non si duplicano. I dati restano su questo dispositivo finché non confermi tu.
          </p>
          {mixedFree > 0 && (
            <p className="text-[15px] text-muted">
              In {plural(mixedFree, "pasto", "pasti")} c&apos;erano piatti liberi e piatti normali insieme: ora il pasto libero vale per tutti i piatti del pasto.
            </p>
          )}
          {failed && (
            <p role="status" className="text-[15px] font-semibold text-bad">
              Importazione non riuscita. Riprova: quello che è già stato importato non si duplica.
            </p>
          )}
          <button type="button" onClick={run} disabled={busy} className={primary}>
            {busy ? "Importazione in corso…" : failed ? "Riprova" : "Importa"}
          </button>
          <button type="button" onClick={onClose} disabled={busy} className={neutral}>
            Più tardi
          </button>
        </div>
      )}

      {stage === "fatto" && result && (
        <div className="flex flex-col gap-4">
          <p className="text-[17px] font-semibold">Importazione completata.</p>
          <p className="text-[15px]">
            Nuovi nell&apos;account: {plural(result.addedDishes, "piatto", "piatti")}, {plural(result.addedWeighIns, "pesata", "pesate")}, {plural(result.addedActivityDays, "giorno di attività", "giorni di attività")}.
            {result.alreadyThere > 0 && ` Già presenti e lasciati com'erano: ${plural(result.alreadyThere, "elemento", "elementi")}.`}
          </p>
          <p className="text-[15px] text-muted">Controlla che sia tutto a posto. I dati sono ancora anche su questo dispositivo: toglili solo quando sei sicuro.</p>
          <button type="button" onClick={() => setStage("conferma")} className={primary}>
            Tutto a posto: togli i dati da questo dispositivo
          </button>
          <button type="button" onClick={onClose} className={neutral}>
            Tienili per ora
          </button>
        </div>
      )}

      {stage === "conferma" && (
        <div className="flex flex-col gap-4" role="alertdialog" aria-label="Conferma">
          <p className="text-[17px]">Togliere i dati da questo dispositivo? Restano nel tuo account online e li vedi anche qui, dopo l&apos;accesso.</p>
          <button type="button" onClick={clearLocal} className={danger}>
            Togli da questo dispositivo
          </button>
          <button type="button" onClick={() => setStage("fatto")} className={neutral}>
            Annulla
          </button>
        </div>
      )}
    </Sheet>
  );
}
