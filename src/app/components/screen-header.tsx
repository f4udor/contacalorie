"use client";

import { CircleButton } from "./ui/ui";
import { IconChevronLeft, IconChevronRight, IconGear, IconNow } from "./ui/icons";
import type { PeriodNav } from "../lib/nav";

interface Props {
  /** La data (o l'intervallo) in piccolo sopra il titolo. */
  kicker: string;
  title: string;
  nav: PeriodNav;
  prevLabel: string;
  nextLabel: string;
  /** Lettura vocale del tasto di ritorno al presente. */
  nowLabel: string;
  onSettings: () => void;
}

/**
 * Intestazione di Oggi e Settimana (BRIEF §10.4): a sinistra la data in piccolo e il titolo; a destra, su una riga, quattro tasti tondi:
 * freccia indietro, ritorno al presente (sempre al suo posto), freccia avanti, ingranaggio. Resta in alto quando si scorre, in vetro.
 */
export function ScreenHeader({ kicker, title, nav, prevLabel, nextLabel, nowLabel, onSettings }: Props) {
  return (
    <header className="sticky top-0 z-30 -mx-4 bg-intestazione-vetro px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-xl">
      <div className="flex items-end justify-between gap-1">
        <div className="min-w-0 pb-1">
          <p className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-wide text-testo-secondario">{kicker}</p>
          <h1 className="whitespace-nowrap text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        </div>
        <div className="-mr-1.5 flex shrink-0 items-center">
          <CircleButton label={prevLabel} href={nav.prevHref}>
            <IconChevronLeft size={16} strokeWidth={2.4} />
          </CircleButton>
          <CircleButton label={nowLabel} href={nav.nowHref} disabled={nav.nowDisabled} tone="comando">
            <IconNow size={18} />
          </CircleButton>
          <CircleButton label={nextLabel} href={nav.nextHref}>
            <IconChevronRight size={16} strokeWidth={2.4} />
          </CircleButton>
          <CircleButton label="Impostazioni" onClick={onSettings}>
            <IconGear size={18} />
          </CircleButton>
        </div>
      </div>
    </header>
  );
}
