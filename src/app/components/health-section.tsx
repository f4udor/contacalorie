"use client";

import { addDays } from "@/engine";
import { useEffect, useState } from "react";
import type { ActivityRecord } from "@/data";
import { useDataStore } from "../data-provider";
import { formatDateLong, formatNumber } from "../lib/format";
import { formatDateTime, receivedFromHealth } from "../lib/health-link";
import { useHealthLink } from "../lib/use-health-link";
import { useToday } from "../lib/use-today";

const button = "min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-accent disabled:opacity-50";
const dangerButton = "min-h-12 w-full rounded-xl bg-bg px-4 text-[17px] font-semibold text-bad disabled:opacity-50";

function CopyRow({ label, value }: { label: string; value: string }) {
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
    <div className="mt-3">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 select-all break-all rounded-xl bg-bg px-3 py-2 font-mono text-[15px]">{value}</p>
      <button type="button" onClick={copy} className="mt-2 min-h-11 rounded-xl px-3 text-[17px] font-semibold text-accent" aria-label={`Copia ${label.toLowerCase()}`}>
        Copia
      </button>
      <span role="status" className="ml-2 text-sm text-muted">
        {state === "copied" ? "Copiato" : state === "failed" ? "Non riesco a copiare: tieni premuto sul testo e scegli Copia." : ""}
      </span>
    </div>
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
    <div className="border-t border-line pt-3" aria-label="Salute">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <span className="text-[17px]">Salute</span>
        <span className={`text-[17px] font-semibold ${link?.active ? "text-ok" : "text-muted"}`}>{link === null ? "controllo…" : link.active ? "collegata" : "non collegata"}</span>
      </div>

      {link && !link.supported && <p className="text-sm text-muted">Il collegamento con Salute richiede l&apos;accesso: ora i dati sono solo su questo dispositivo.</p>}

      {link?.supported && code !== null && (
        <div>
          <p className="text-sm font-medium">Questo codice si vede solo adesso: copialo nel Comando rapido prima di chiudere.</p>
          <CopyRow label="Codice" value={code} />
          <CopyRow label="Indirizzo" value={endpoint} />
          <button type="button" onClick={() => setCode(null)} className={`${button} mt-3`}>
            Fatto
          </button>
        </div>
      )}

      {link?.supported && code === null && !link.active && (
        <div>
          <p className="mb-3 text-sm text-muted">Passi e km in bici arrivano da soli dall&apos;iPhone con un Comando rapido. Prima crea il codice personale. Come fare: docs/COLLEGA-SALUTE.md.</p>
          <button type="button" disabled={busy} onClick={() => act(() => store!.createHealthCode())} className={button}>
            Crea codice
          </button>
        </div>
      )}

      {link?.supported && code === null && link.active && (
        <div>
          <dl className="text-[15px]">
            <div className="flex justify-between gap-3 py-1">
              <dt className="text-muted">Ultimo invio riuscito</dt>
              <dd className="text-right font-semibold tabular-nums">{link.lastSuccessAt ? formatDateTime(link.lastSuccessAt) : "Nessun invio ancora"}</dd>
            </div>
            {received.map((r) => (
              <div key={r.date} className="flex justify-between gap-3 py-1">
                <dt className="text-muted">{r.date === today ? "Oggi" : "Ieri"}</dt>
                <dd className="text-right tabular-nums" aria-label={formatDateLong(r.date)}>
                  {[r.steps !== null ? `${formatNumber(r.steps)} passi` : null, r.km !== null ? `${formatNumber(r.km, 1)} km` : null].filter(Boolean).join(" · ")}
                </dd>
              </div>
            ))}
          </dl>
          {link.lastAttempt && !link.lastAttempt.success && (
            <p role="status" className="mt-1 text-sm font-medium text-bad">
              Ultimo tentativo non riuscito ({formatDateTime(link.lastAttempt.at)}){link.lastAttempt.detail ? `: ${link.lastAttempt.detail}` : ""}
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            {confirmRegenerate ? (
              <div className="rounded-xl bg-bg p-3">
                <p className="text-sm">Il Comando rapido smette di funzionare finché non ci incolli il nuovo codice. Rigenerare?</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={busy} onClick={() => act(() => store!.createHealthCode())} className="min-h-12 flex-1 rounded-xl bg-accent px-3 text-[17px] font-semibold text-white disabled:opacity-50">
                    Rigenera
                  </button>
                  <button type="button" onClick={() => setConfirmRegenerate(false)} className="min-h-12 flex-1 rounded-xl px-3 text-[17px] font-semibold text-accent">
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" disabled={busy} onClick={() => setConfirmRegenerate(true)} className={button}>
                Rigenera codice
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => act(() => store!.revokeHealthCode())} className={dangerButton}>
              Disattiva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
