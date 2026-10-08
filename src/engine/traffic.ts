import { ringGreenAbove, ringGreenBelow, ringYellowAbove } from "./defaults";
import type { Settings } from "./types";

export type Light = "verde" | "giallo" | "rosso" | "neutro";
export type RingColor = "accento" | "verde" | "giallo" | "rosso" | "neutro";

/** Elimina il rumore dei decimali binari (es. 140 × 0,9) senza alterare i confini reali. */
function clean(n: number): number {
  return Math.round(n * 1e9) / 1e9;
}

/** Nutrienti "minimo" (proteine, fibre): giallo sotto T(1−m), rosso sopra T × overLimit. */
export function lightMinimum(x: number, target: number, s: Pick<Settings, "margin" | "overLimit">): Light {
  if (target <= 0) return "neutro";
  if (x < clean(target * (1 - s.margin))) return "giallo";
  if (x > clean(target * s.overLimit)) return "rosso";
  return "verde";
}

/** Nutrienti "intervallo" (carboidrati, grassi): verde da T(1−m) a T(1+m). */
export function lightRange(x: number, target: number, s: Pick<Settings, "margin">): Light {
  if (target <= 0) return "neutro";
  if (x < clean(target * (1 - s.margin))) return "giallo";
  if (x > clean(target * (1 + s.margin))) return "rosso";
  return "verde";
}

/** Nutrienti "tetto" (sale): verde sotto T(1−m), giallo da T(1−m) a T, rosso sopra T. */
export function lightCeiling(x: number, target: number, s: Pick<Settings, "margin">): Light {
  if (target <= 0) return "neutro";
  if (x > target) return "rosso";
  if (x >= clean(target * (1 - s.margin))) return "giallo";
  return "verde";
}

/**
 * Anello kcal (BRIEF §3.5). Con d = kcal contate − obiettivo: accento se d < −ringGreenBelow (in corso), verde da −ringGreenBelow
 * a +ringGreenAbove (estremi compresi), giallo oltre e fino a +ringYellowAbove compreso, rosso oltre.
 */
export function lightKcalRing(eaten: number, target: number): RingColor {
  if (target <= 0) return "neutro";
  const d = clean(eaten - target);
  if (d < -ringGreenBelow) return "accento";
  if (d <= ringGreenAbove) return "verde";
  if (d <= ringYellowAbove) return "giallo";
  return "rosso";
}
