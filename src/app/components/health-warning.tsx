"use client";

import { IconChevronRight } from "./ui/icons";
import { shouldWarnHealth } from "../lib/health-link";
import { useHealthLink } from "../lib/use-health-link";

/** Avviso in cima a Oggi: c'è un codice attivo ma da più di 24 ore non arrivano dati da Salute. */
export function HealthWarning({ onOpen }: { onOpen: () => void }) {
  const { link } = useHealthLink();
  if (!link || !shouldWarnHealth(link, new Date())) return null;
  return (
    <button type="button" onClick={onOpen} className="mb-3 flex min-h-12 w-full items-center justify-between gap-3 rounded-tessera bg-attenzione px-4 py-3 text-left text-[15px] font-semibold text-testo-su-comando">
      <span>Nessun dato da Salute da ieri</span>
      <IconChevronRight size={16} strokeWidth={2.4} />
    </button>
  );
}
