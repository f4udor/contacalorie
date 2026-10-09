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

/** "16 luglio 2026" */
export function formatDateFull(date: DateKey): string {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(utcDate(date));
}

/** "5 gen" (mese abbreviato, senza punto) */
export function formatDayMonthShort(date: DateKey): string {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(utcDate(date)).replace(".", "");
}

/** "5 – 11 ottobre" (stesso mese) o "28 set – 4 ott" (mesi diversi): l'intervallo di una settimana (lunedì → domenica). */
export function formatWeekRange(monday: DateKey): string {
  const sunday = new Date(utcDate(monday).getTime() + 6 * 86400000);
  const sundayKey = `${sunday.getUTCFullYear()}-${String(sunday.getUTCMonth() + 1).padStart(2, "0")}-${String(sunday.getUTCDate()).padStart(2, "0")}`;
  const m1 = monday.slice(5, 7);
  const m2 = sundayKey.slice(5, 7);
  if (m1 === m2) {
    const day = new Intl.DateTimeFormat("it-IT", { day: "numeric", timeZone: "UTC" }).format(utcDate(monday));
    return `${day} – ${formatDayMonth(sundayKey)}`;
  }
  return `${formatDayMonthShort(monday)} – ${formatDayMonthShort(sundayKey)}`;
}

/** "Lunedì 5": il giorno della settimana e il numero, per le righe dei pannelli. */
export function formatWeekdayDay(date: DateKey): string {
  const day = new Intl.DateTimeFormat("it-IT", { day: "numeric", timeZone: "UTC" }).format(utcDate(date));
  return `${formatWeekday(date)} ${day}`;
}

/** "martedì" (minuscolo, per «Cena di martedì»). */
export function formatWeekdayLower(date: DateKey): string {
  return formatWeekday(date).toLowerCase();
}

/** Peso in kg con sempre un decimale: «92,0», «98,6». */
export function formatKg(kg: number): string {
  return new Intl.NumberFormat("it-IT", { useGrouping: "always", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kg);
}
