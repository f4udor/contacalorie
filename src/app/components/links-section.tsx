"use client";

import { useAiAvailable } from "../lib/use-ai";
import { HealthSection } from "./health-section";

/** Sezione "Collegamenti" di Impostazioni: stima automatica (AI) e dati da Salute. */
export function LinksSection() {
  const available = useAiAvailable();
  const text = available === null ? "controllo…" : available ? "attiva" : "non configurata";
  return (
    <section id="collegamenti" className="mt-3 scroll-mt-4 rounded-2xl bg-card p-4" aria-label="Collegamenti">
      <h2 className="text-[22px] font-bold leading-tight">Collegamenti</h2>
      <p className="mb-2 mt-1 text-sm text-muted">I servizi esterni usati dall&apos;app.</p>
      <div className="flex min-h-12 items-center justify-between gap-3">
        <span className="text-[17px]">Stima automatica (AI)</span>
        <span className={`text-[17px] font-semibold ${available ? "text-ok" : "text-muted"}`}>{text}</span>
      </div>
      {available === false && <p className="mb-2 text-sm text-muted">Senza AI puoi inserire i piatti a mano. Come attivarla: docs/COLLEGA-VERTEX.md.</p>}
      <HealthSection />
    </section>
  );
}
