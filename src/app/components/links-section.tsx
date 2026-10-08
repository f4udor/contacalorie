"use client";

import { useAiAvailable } from "../lib/use-ai";

/** Sezione "Collegamenti" di Impostazioni: per ora lo stato della stima automatica (AI). */
export function LinksSection() {
  const available = useAiAvailable();
  const text = available === null ? "controllo…" : available ? "attiva" : "non configurata";
  return (
    <section className="mt-3 rounded-2xl bg-card p-4" aria-label="Collegamenti">
      <h2 className="text-[22px] font-bold leading-tight">Collegamenti</h2>
      <p className="mb-2 mt-1 text-sm text-muted">I servizi esterni usati dall&apos;app.</p>
      <div className="flex min-h-12 items-center justify-between gap-3">
        <span className="text-[17px]">Stima automatica (AI)</span>
        <span className={`text-[17px] font-semibold ${available ? "text-ok" : "text-muted"}`}>{text}</span>
      </div>
      {available === false && <p className="text-sm text-muted">Senza AI puoi inserire i piatti a mano. Come attivarla: docs/COLLEGA-VERTEX.md.</p>}
    </section>
  );
}
