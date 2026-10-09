"use client";

import { useAiAvailable } from "../lib/use-ai";
import { HealthSection } from "./health-section";

/** Pagina "Collegamenti" di Impostazioni: stima automatica (AI) e dati da Salute. */
export function LinksSection() {
  const available = useAiAvailable();
  const text = available === null ? "controllo…" : available ? "attiva" : "non configurata";
  return (
    <section id="collegamenti" className="rounded-2xl bg-card p-4" aria-label="Collegamenti">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <span className="text-[17px]">Stima automatica (AI)</span>
        <span className={`text-[17px] font-semibold ${available ? "text-ok" : "text-muted"}`}>{text}</span>
      </div>
      {available === false && <p className="mb-2 text-sm text-muted">Senza AI puoi inserire i piatti a mano. Come attivarla: docs/COLLEGA-VERTEX.md.</p>}
      <HealthSection />
    </section>
  );
}
