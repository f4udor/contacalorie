"use client";

import { useState } from "react";
import { clearBrowserData, importLocalData, normalizeFreeFlags, summarize } from "@/data";
import type { DataStore, ImportResult, StoredData } from "@/data";
import { plural } from "../lib/plural";
import { Sheet } from "./sheet";
import { PillButton } from "./ui/ui";

interface Props {
  /** I dati di questo dispositivo da importare. */
  local: StoredData;
  /** L'archivio dell'account in cui importarli. */
  remote: DataStore;
  onClose: () => void;
  /** Chiamata dopo aver tolto i dati dal dispositivo. */
  onLocalCleared: () => void;
}


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
    <Sheet open onClose={onClose} title={stage === "conferma" ? "Rimuovere i dati?" : "Importa i dati di questo dispositivo"}>
      {stage === "proponi" && (
        <div className="flex flex-col gap-4">
          <p className="text-[17px]">
            Su questo dispositivo ci sono dati salvati prima dell&apos;accesso: <strong>{plural(s.days, "giorno", "giorni")}</strong>, <strong>{plural(s.dishes, "piatto", "piatti")}</strong>,{" "}
            <strong>{plural(s.weighIns, "pesata", "pesate")}</strong>.
          </p>
          <p className="text-[15px] text-testo-secondario">
            Importandoli finiscono nel tuo account e li vedi anche dagli altri dispositivi. Se li hai già importati, non si duplicano. I dati restano su questo dispositivo finché non confermi tu.
          </p>
          {mixedFree > 0 && (
            <p className="text-[15px] text-testo-secondario">
              In {plural(mixedFree, "pasto", "pasti")} c&apos;erano piatti liberi e piatti normali insieme: ora il pasto libero vale per tutti i piatti del pasto.
            </p>
          )}
          {failed && (
            <p role="status" className="text-[15px] font-semibold text-fuori">
              Importazione non riuscita. Riprova: quello che è già stato importato non si duplica.
            </p>
          )}
          <PillButton filled onClick={run} disabled={busy}>
            {busy ? "Importazione in corso…" : failed ? "Riprova" : "Importa"}
          </PillButton>
          <PillButton onClick={onClose} disabled={busy}>Più tardi</PillButton>
        </div>
      )}

      {stage === "fatto" && result && (
        <div className="flex flex-col gap-4">
          <p className="text-[17px] font-semibold">Importazione completata.</p>
          <p className="text-[15px]">
            Nuovi nell&apos;account: {plural(result.addedDishes, "piatto", "piatti")}, {plural(result.addedWeighIns, "pesata", "pesate")}, {plural(result.addedActivityDays, "giorno di attività", "giorni di attività")}
            {result.addedFavorites > 0 && `, ${plural(result.addedFavorites, "preferito", "preferiti")}`}.
            {result.alreadyThere > 0 && ` Già presenti e lasciati com'erano: ${plural(result.alreadyThere, "elemento", "elementi")}.`}
          </p>
          <p className="text-[15px] text-testo-secondario">Controlla che sia tutto a posto. I dati sono ancora anche su questo dispositivo: rimuovili solo quando sei sicuro.</p>
          <PillButton filled onClick={() => setStage("conferma")}>Tutto a posto: rimuovi i dati da questo dispositivo</PillButton>
          <PillButton onClick={onClose}>Tienili per ora</PillButton>
        </div>
      )}

      {stage === "conferma" && (
        <div className="flex flex-col gap-4" role="alertdialog" aria-label="Conferma">
          <p className="text-[17px]">Rimuovere i dati da questo dispositivo? Restano nel tuo account online e li vedi anche qui, dopo l&apos;accesso.</p>
          <PillButton filled onClick={clearLocal}>Rimuovi da questo dispositivo</PillButton>
          <PillButton onClick={() => setStage("fatto")}>Annulla</PillButton>
        </div>
      )}
    </Sheet>
  );
}
