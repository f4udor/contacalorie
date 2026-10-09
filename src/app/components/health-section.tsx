"use client";

import { addDays } from "@/engine";
import { useEffect, useState } from "react";
import type { ActivityRecord } from "@/data";
import { useDataStore } from "../data-provider";
import { formatDateLong, formatNumber } from "../lib/format";
import { formatDateTime, receivedFromHealth } from "../lib/health-link";
import { useHealthLink } from "../lib/use-health-link";
import { useToday } from "../lib/use-today";
import { ActionRow, Caption, GroupedList, PillButton, ValueRow } from "./ui/ui";

function CopyRow({ title, label, value }: { title: string; label: string; value: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };
  return (
    <li className="px-4 py-2.5">
      <p className="text-[13px] text-testo-secondario">{title}</p>
      <p className="mt-1 select-all break-all font-mono text-[15px]">{value}</p>
      <button type="button" onClick={copy} className="mt-1 min-h-11 text-[17px] font-medium text-comando" aria-label={label}>
        {label}
      </button>
      <span role="status" className="ml-2 text-[13px] text-testo-secondario">
        {state === "copied" ? "Copiato" : state === "failed" ? "Non riesco a copiare: tieni premuto sul testo e scegli Copia." : ""}
      </span>
    </li>
  );
}

/** Voce "Salute" di Collegamenti: codice personale per il Comando rapido, ultimo invio e valori ricevuti. */
export function HealthSection() {
  const store = useDataStore();
  const today = useToday();
  const { link, reload } = useHealthLink();
  const [code, setCode] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    if (!store || !today || !link?.active) return;
    let alive = true;
    store.listActivityBetween(addDays(today, -1), today).then(
      (a) => alive && setActivity(a),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [store, today, link?.active, link?.lastSuccessAt]);

  const act = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    try {
      const result = await fn();
      setCode(typeof result === "string" ? result : null);
      setConfirmRegenerate(false);
      reload();
    } catch {
      // Operazione non riuscita: l'avviso in cima lo spiega.
    } finally {
      setBusy(false);
    }
  };

  const endpoint = typeof window === "undefined" ? "" : `${window.location.origin}/api/ingest/health`;
  const received = today ? receivedFromHealth(activity, [today, addDays(today, -1)]) : [];

  return (
    <section className="flex flex-col gap-1.5" aria-label="Salute">
      <h2 className="px-4 text-[13px] font-medium uppercase tracking-wide text-testo-secondario">Salute</h2>
      <GroupedList>
        <ValueRow title="Stato" value={link === null ? "Controllo…" : link.active ? "Attiva" : "Non attiva"} />
        {link?.supported && code === null && link.active && (
          <>
            <ValueRow title="Ultimo invio" value={link.lastSuccessAt ? formatDateTime(link.lastSuccessAt) : "Nessuno"} />
            {received.map((r) => (
              <ValueRow
                key={r.date}
                title={r.date === today ? "Ricevuti oggi" : "Ricevuti ieri"}
                value={<span aria-label={formatDateLong(r.date)}>{[r.steps !== null ? `${formatNumber(r.steps)} passi` : null, r.km !== null ? `${formatNumber(r.km, 1)} km` : null].filter(Boolean).join(" · ")}</span>}
              />
            ))}
          </>
        )}
        {link?.supported && code !== null && (
          <>
            <CopyRow title="Codice" label="Copia il codice" value={code} />
            <CopyRow title="Indirizzo" label="Copia l'indirizzo" value={endpoint} />
          </>
        )}
      </GroupedList>

      {link && !link.supported && <Caption>Accedi per collegare Salute.</Caption>}
      {link?.supported && code !== null && <Caption>Il codice si vede solo adesso: copialo nel Comando rapido.</Caption>}
      {link?.supported && code === null && !link.active && <Caption>Passi e km arrivano dall&apos;iPhone con un Comando rapido. Crea il codice per iniziare.</Caption>}
      {link?.supported && code === null && link.active && link.lastAttempt && !link.lastAttempt.success && (
        <Caption tone="fuori">
          Ultimo tentativo non riuscito ({formatDateTime(link.lastAttempt.at)}){link.lastAttempt.detail ? `: ${link.lastAttempt.detail}` : ""}
        </Caption>
      )}

      <div className="mt-2 flex flex-col gap-2">
        {link?.supported && code !== null && <PillButton filled onClick={() => setCode(null)}>Fatto</PillButton>}
        {link?.supported && code === null && !link.active && (
          <PillButton filled disabled={busy} onClick={() => act(() => store!.createHealthCode())}>
            Crea il codice
          </PillButton>
        )}
        {link?.supported && code === null && link.active && (
          <>
            {confirmRegenerate ? (
              <>
                <Caption>Rigenerando il codice il Comando rapido smette di inviare finché non lo aggiorni.</Caption>
                <PillButton filled disabled={busy} onClick={() => act(() => store!.createHealthCode())}>Rigenera</PillButton>
                <PillButton onClick={() => setConfirmRegenerate(false)}>Annulla</PillButton>
              </>
            ) : (
              <PillButton disabled={busy} onClick={() => setConfirmRegenerate(true)}>Rigenera il codice</PillButton>
            )}
            <GroupedList>
              <ActionRow tone="fuori" label="Disattiva" disabled={busy} onClick={() => act(() => store!.revokeHealthCode())} />
            </GroupedList>
          </>
        )}
      </div>
    </section>
  );
}
