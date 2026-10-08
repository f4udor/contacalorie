import { kcalCheckMin, kcalCheckShare } from "./defaults";
import type { Meal } from "./types";

/** Numeri di un piatto che servono al controllo di coerenza. */
export type DishNumbers = Pick<Meal, "kcal" | "protein" | "carbs" | "fat">;

/** Elimina il rumore dei decimali binari senza alterare i confini reali. */
const clean = (n: number): number => Math.round(n * 1e9) / 1e9;

/** Kcal che i macronutrienti dichiarati danno: 4 × proteine + 4 × carboidrati + 9 × grassi. */
export function kcalFromMacros(d: Pick<Meal, "protein" | "carbs" | "fat">): number {
  return clean(4 * d.protein + 4 * d.carbs + 9 * d.fat);
}

/**
 * BRIEF §3.7: la stima di un piatto è "da controllare" se le kcal dichiarate sono più basse di `kcalMacro` di oltre
 * `kcalCheckShare` (in quota di `kcalMacro`) **e** di oltre `kcalCheckMin` kcal. Si segnala solo la sottostima.
 * Il controllo avvisa: non blocca e non corregge i numeri.
 */
export function needsKcalCheck(d: DishNumbers, share: number = kcalCheckShare, min: number = kcalCheckMin): boolean {
  const gap = clean(kcalFromMacros(d) - d.kcal);
  return gap > clean(share * kcalFromMacros(d)) && gap > min;
}
