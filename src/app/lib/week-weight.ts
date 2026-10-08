import { addDays } from "@/engine";
import type { DateKey } from "@/engine";
import type { WeighIn } from "@/data";

export interface WeekWeight {
  /** Ultima pesata della settimana, in kg. */
  kg: number;
  /** Differenza con la pesata precedente (o con il peso di partenza del profilo), arrotondata a 0,1 kg; null se manca un confronto. */
  diff: number | null;
  /** "ok" se ci si avvicina al peso obiettivo, "bad" se ci si allontana, "neutro" altrimenti. */
  tone: "ok" | "bad" | "neutro";
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Il peso della settimana che inizia il lunedì `monday`: l'ultima pesata della settimana,
 * confrontata con l'ultima pesata prima del lunedì o, se non c'è, con il peso di partenza del profilo.
 * null se nella settimana non ci sono pesate.
 */
export function weekWeight(weighIns: readonly WeighIn[], monday: DateKey, startKg: number | null, targetKg: number | null): WeekWeight | null {
  const sunday = addDays(monday, 6);
  const sorted = [...weighIns].sort((a, b) => a.date.localeCompare(b.date));
  const inWeek = sorted.filter((w) => w.date >= monday && w.date <= sunday);
  if (inWeek.length === 0) return null;
  const kg = inWeek[inWeek.length - 1].weightKg;
  const before = sorted.filter((w) => w.date < monday);
  const reference = before.length > 0 ? before[before.length - 1].weightKg : startKg;
  const diff = reference === null ? null : round1(kg - reference);
  let tone: WeekWeight["tone"] = "neutro";
  if (diff !== null && diff !== 0 && targetKg !== null && reference !== null) {
    const closer = Math.abs(kg - targetKg) < Math.abs(reference - targetKg);
    tone = closer ? "ok" : "bad";
  }
  return { kg, diff, tone };
}
