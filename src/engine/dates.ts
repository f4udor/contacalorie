import type { DateKey } from "./types";

const MS_PER_DAY = 86_400_000;

function toUtcMs(date: DateKey): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Data non valida: ${date}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    throw new Error(`Data non valida: ${date}`);
  }
  return ms;
}

function fromUtcMs(ms: number): DateKey {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Indice del giorno nella settimana: lunedì = 0, domenica = 6. Indipendente dal fuso della macchina. */
export function weekdayIndex(date: DateKey): number {
  const jsDay = new Date(toUtcMs(date)).getUTCDay(); // 0 = domenica
  return (jsDay + 6) % 7;
}

/** Aggiunge (o toglie) giorni a una data. */
export function addDays(date: DateKey, days: number): DateKey {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

/** Lunedì della settimana che contiene la data. */
export function weekStart(date: DateKey): DateKey {
  return addDays(date, -weekdayIndex(date));
}

/** Le sette date (lunedì-domenica) della settimana che contiene la data. */
export function weekDates(date: DateKey): DateKey[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
