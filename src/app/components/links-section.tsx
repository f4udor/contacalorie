"use client";

import { useAiInfo } from "../lib/use-ai";
import { HealthSection } from "./health-section";
import { Caption, GroupedList, ValueRow } from "./ui/ui";

/** Pagina "Collegamenti" di Impostazioni: Salute e stime dei pasti, due elenchi con il titolo sopra. */
export function LinksSection() {
  const info = useAiInfo();
  const state = info === null ? "Controllo…" : info?.available ? "Attivo" : "Non attivo";
  const showUsed = info?.available && info.usedToday !== null;
  return (
    <div id="collegamenti" className="flex flex-col gap-6" aria-label="Collegamenti">
      <HealthSection />
      <section className="flex flex-col gap-1.5" aria-label="Stime dei pasti">
        <h2 className="px-4 text-[13px] font-medium uppercase tracking-wide text-testo-secondario">Stime dei pasti</h2>
        <GroupedList>
          {info?.available && info.model && <ValueRow title="Modello" value={info.model} />}
          <ValueRow title="Stato" value={state} />
          {showUsed && <ValueRow title="Stime di oggi" value={info.limit !== null ? `${info.usedToday} di ${info.limit}` : String(info.usedToday)} />}
        </GroupedList>
        {info !== null && !info.available && <Caption>Senza stime inserisci i piatti a mano.</Caption>}
      </section>
    </div>
  );
}
