import type { DateKey } from "@/engine";

const formatters = new Map<number, Intl.NumberFormat>();

function nf(decimals: number): Intl.NumberFormat {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("it-IT", { useGrouping: "always", minimumFractionDigits: 0, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f;
}

/** Numero in formato italiano: 1.994 e 4,8. Il segno meno è quello tipografico (−). */
export function formatNumber(n: number, decimals = 0): string {
  const text = nf(decimals).format(Math.abs(n));
  const isZero = Number(text.replace(/\./g, "").replace(",", ".")) === 0;
  return n < 0 && !isZero ? `−${text}` : text;
}

/** Numero con segno esplicito: +400, −106, 0. */
export function formatSigned(n: number, decimals = 0): string {
  const text = formatNumber(Math.abs(n), decimals);
  if (Number(text.replace(/\./g, "").replace(",", ".")) === 0) return "0";
  return n < 0 ? `−${text}` : `+${text}`;
}

/** Variazione di peso in kg: sempre il segno e un decimale, col meno tipografico ("−0,4", "+0,3"). Una differenza che arrotondata vale 0,0 si scrive "0,0". */
export function formatWeightDelta(kg: number): string {
  // Sempre un decimale (anche "12,0"), con il punto delle migliaia.
  const text = new Intl.NumberFormat("it-IT", { useGrouping: "always", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(kg));
  if (Number(text.replace(/\./g, "").replace(",", ".")) === 0) return "0,0";
  return kg < 0 ? `−${text}` : `+${text}`;
}

function utcDate(date: DateKey): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Giovedì" */
export function formatWeekday(date: DateKey): string {
  return capitalize(new Intl.DateTimeFormat("it-IT", { weekday: "long", timeZone: "UTC" }).format(utcDate(date)));
}

/** "8 gennaio" */
export function formatDayMonth(date: DateKey): string {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(utcDate(date));
}

/** "Giovedì 8 gennaio" */
export function formatDateLong(date: DateKey): string {
  return `${formatWeekday(date)} ${formatDayMonth(date)}`;
}
