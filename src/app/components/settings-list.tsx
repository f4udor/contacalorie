import type { ReactNode } from "react";
import { Caption, ActionRow, GroupedList, ValueRow } from "./ui/ui";
import type { SectionId } from "../lib/settings-sections";

/**
 * Prima pagina di Impostazioni (BRIEF §10.5, bozza): elenchi raggruppati con il valore attuale a destra, l'azione «Esporta i dati» nel colore
 * Comando, Collegamenti staccata in fondo e, se c'è l'accesso, l'email e «Esci» nel colore Fuori. Nessun campo modificabile.
 */
export function SettingsList({ summaries, onOpen, linksNote, account }: { summaries: Record<SectionId, string>; onOpen: (id: SectionId) => void; linksNote?: string; account?: ReactNode }) {
  return (
    <nav aria-label="Impostazioni" className="flex flex-col gap-4">
      <GroupedList>
        <ValueRow title="Profilo" value={summaries.profilo} onClick={() => onOpen("profilo")} />
        <ValueRow title="Obiettivi" value={summaries.obiettivi} onClick={() => onOpen("obiettivi")} />
      </GroupedList>
      <GroupedList>
        <ValueRow title="Attività" value={summaries.attivita || undefined} onClick={() => onOpen("attivita")} />
        <ValueRow title="Pasto libero" value={summaries["pasto-libero"]} onClick={() => onOpen("pasto-libero")} />
      </GroupedList>
      <GroupedList>
        <ActionRow label="Esporta i dati" onClick={() => onOpen("dati")} />
      </GroupedList>
      <div className="flex flex-col gap-1.5">
        <GroupedList>
          <ValueRow title="Collegamenti" value={summaries.collegamenti || undefined} onClick={() => onOpen("collegamenti")} />
        </GroupedList>
        {linksNote && <Caption>{linksNote}</Caption>}
      </div>
      {account}
    </nav>
  );
}
