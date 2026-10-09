"use client";

import { IconPlus } from "./ui/icons";

/**
 * Tasto + (BRIEF §10.4): cerchio di 52 px nel colore Comando al 62 %, sospeso in basso a destra sopra la barra e staccato da essa di 12 px.
 * In vetro, senza sfumature né alone: la sfocatura non è l'unica cosa che lo rende leggibile, sotto c'è il colore.
 */
export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Aggiungi"
      onClick={onClick}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem+62px+0.75rem)] right-[max(1rem,calc((100vw-36rem)/2+1rem))] z-30 grid size-[52px] place-items-center rounded-full border border-vetro-luce bg-comando-tasto-piu text-testo-su-comando backdrop-blur-md"
    >
      <IconPlus size={26} strokeWidth={2.2} />
    </button>
  );
}
