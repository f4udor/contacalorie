import type { DateKey } from "@/engine";
import type { WeighIn } from "@/data";

export type WeightTone = "ok" | "bad" | "neutral";

export interface WeekWeight {
  /** Ultima pesata della settimana. */
  lastKg: number;
  lastDate: DateKey;
  /** Differenza in kg con il confronto, a una cifra decimale; null se non c'è con cosa confrontare. */
  deltaKg: number | null;
  /** Con cosa è stata confrontata: l'ultima pesata prima del lunedì, oppure il peso del profilo (peso di partenza). */
  comparedWith: "pesata" | "profilo" | null;
  /** Verde se ci si avvicina al peso obiettivo, rosso se ci si allontana (anche quando l'obiettivo è salire), neutro senza obiettivo, senza confronto o senza variazione. */
  tone: WeightTone;
}

/**
 * Il peso della settimana che inizia di lunedì `monday`: l'ultima pesata della settimana e di quanto è cambiata rispetto
 * all'ultima pesata precedente al lunedì o, se non ce n'è, al peso del profilo. Null se nella settimana non ci sono pesate.
 * Le pesate possono arrivare in qualsiasi ordine.
 */
export function weekWeight(input: { monday: DateKey; sunday: DateKey; weighIns: readonly WeighIn[]; profileWeightKg?: number; targetWeightKg?: number }): WeekWeight | null {
  const { monday, sunday, weighIns, profileWeightKg, targetWeightKg } = input;
  const byDateDesc = [...weighIns].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const last = byDateDesc.find((w) => w.date >= monday && w.date <= sunday);
  if (!last) return null;

  const previous = byDateDesc.find((w) => w.date < monday);
  const baseline = previous ? previous.weightKg : profileWeightKg;
  const comparedWith = previous ? "pesata" : profileWeightKg !== undefined ? "profilo" : null;
  if (baseline === undefined) return { lastKg: last.weightKg, lastDate: last.date, deltaKg: null, comparedWith: null, tone: "neutral" };

  const deltaKg = Math.round((last.weightKg - baseline) * 10) / 10;
  let tone: WeightTone = "neutral";
  if (deltaKg !== 0 && targetWeightKg !== undefined) {
    const before = Math.abs(baseline - targetWeightKg);
    const after = Math.abs(last.weightKg - targetWeightKg);
    tone = after < before ? "ok" : after > before ? "bad" : "neutral";
  }
  return { lastKg: last.weightKg, lastDate: last.date, deltaKg: deltaKg === 0 ? 0 : deltaKg, comparedWith, tone };
}

export const NO_WEIGHT_TEXT = "Nessuna pesata";

export interface WeightCard {
  value: string;
  hint?: string;
  tone?: WeightTone;
}

/** Testi della scheda Peso della Settimana: c'è sempre; senza pesate nella settimana dice "Nessuna pesata". */
export function weightCard(weight: WeekWeight | null, formatKg: (kg: number) => string, formatDelta: (kg: number) => string): WeightCard {
  if (!weight) return { value: NO_WEIGHT_TEXT };
  return {
    value: `${formatKg(weight.lastKg)} kg`,
    hint: weight.deltaKg === null ? undefined : `${formatDelta(weight.deltaKg)} kg ${weight.comparedWith === "pesata" ? "dalla precedente" : "dal peso di partenza"}`,
    tone: weight.tone,
  };
}
