import { addDays, weekStart } from "@/engine";
import type { DateKey } from "@/engine";

/** Dove portano le frecce e il tasto di ritorno al presente di un'intestazione. */
export interface PeriodNav {
  prevHref: string;
  nextHref: string;
  /** Il tasto di ritorno al presente: attivo solo se si sta guardando un altro giorno o un'altra settimana. */
  nowHref: string;
  nowDisabled: boolean;
}

const dayHref = (date: DateKey, today: DateKey): string => (date === today ? "/" : `/?d=${date}`);

/** Frecce e ritorno al presente di Oggi: `date` è il giorno mostrato. */
export function dayNav(date: DateKey, today: DateKey): PeriodNav {
  return { prevHref: dayHref(addDays(date, -1), today), nextHref: dayHref(addDays(date, 1), today), nowHref: "/", nowDisabled: date === today };
}

const weekHref = (monday: DateKey, today: DateKey): string => (monday === weekStart(today) ? "/settimana" : `/settimana?w=${monday}`);

/** Frecce e ritorno al presente della Settimana: `monday` è il lunedì della settimana mostrata. */
export function weekNav(monday: DateKey, today: DateKey): PeriodNav {
  return { prevHref: weekHref(addDays(monday, -7), today), nextHref: weekHref(addDays(monday, 7), today), nowHref: "/settimana", nowDisabled: monday === weekStart(today) };
}

/** Lunedì della settimana precedente o successiva, dentro un pannello (senza cambiare indirizzo). */
export function shiftWeek(monday: DateKey, direction: -1 | 1): DateKey {
  return addDays(monday, direction * 7);
}

/** In un pannello con le frecce delle settimane non si va oltre la settimana corrente. */
export function canGoNextWeek(monday: DateKey, today: DateKey): boolean {
  return monday < weekStart(today);
}

/** Quale voce della barra è attiva per un percorso. Le Impostazioni non sono più nella barra. */
export function activeTab(pathname: string): "oggi" | "settimana" | "grafici" | null {
  if (pathname === "/") return "oggi";
  if (pathname.startsWith("/settimana")) return "settimana";
  if (pathname.startsWith("/grafici")) return "grafici";
  return null;
}

/** La settimana mostrata dentro un pannello: sta da sola, la schermata sotto non la conosce e non cambia. */
export type PanelWeekAction = "indietro" | "avanti" | "oggi";

/**
 * Cambio di settimana nel pannello: indietro e avanti spostano di sette giorni (avanti non oltre la settimana corrente),
 * «oggi» riporta alla settimana corrente. Restituisce il nuovo lunedì del pannello.
 */
export function panelWeekReducer(monday: DateKey, action: PanelWeekAction, today: DateKey): DateKey {
  if (action === "indietro") return shiftWeek(monday, -1);
  if (action === "avanti") return canGoNextWeek(monday, today) ? shiftWeek(monday, 1) : monday;
  return weekStart(today);
}
