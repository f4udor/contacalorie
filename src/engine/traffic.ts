import { KCAL_RING_YELLOW_LIMIT } from "./defaults";
import type { Settings } from "./types";

export type Light = "verde" | "giallo" | "rosso" | "neutro";
export type RingColor = "accento" | "giallo" | "rosso" | "neutro";

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

/** Anello kcal: accento fino a T, giallo fino a T × 1,05, rosso oltre. */
export function lightKcalRing(eaten: number, target: number): RingColor {
  if (target <= 0) return "neutro";
  if (eaten <= target) return "accento";
  if (eaten <= clean(target * KCAL_RING_YELLOW_LIMIT)) return "giallo";
  return "rosso";
}
