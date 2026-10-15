/** Numeri di un piatto che si ricalcolano in proporzione alla quantità (BRIEF §4.1). */
export interface ScalableNumbers {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
}

/**
 * Arrotonda a `decimals` decimali con il «mezzo in su» sul valore scritto in decimale: 19,95 → 20,0 anche se in binario
 * 19,95 vale 19,9499… (con `Math.round(x * 10) / 10` darebbe 19,9).
 */
export function roundHalfUp(n: number, decimals: number): number {
  // Numeri scritti in notazione esponenziale (molto piccoli o molto grandi): niente trucco sul testo.
  if (String(n).includes("e")) return Math.round(n * 10 ** decimals) / 10 ** decimals;
  return Number(`${Math.round(Number(`${n}e${decimals}`))}e-${decimals}`);
}

/** Rapporto tra un peso nuovo e un peso di partenza (grammi); null se uno dei due non è un numero positivo. */
export function weightRatio(baseWeightG: number, newWeightG: number): number | null {
  if (!(baseWeightG > 0) || !(newWeightG > 0) || !Number.isFinite(baseWeightG) || !Number.isFinite(newWeightG)) return null;
  return newWeightG / baseWeightG;
}

/**
 * BRIEF §4.1: kcal e nutrienti di un piatto in proporzione al rapporto `ratio`: kcal arrotondate all'intero, nutrienti a un decimale.
 * Con rapporto 1 i valori restano quelli di partenza (nessun arrotondamento); un rapporto non positivo non è valido (null).
 */
export function scaleNutrients(base: ScalableNumbers, ratio: number): ScalableNumbers | null {
  if (!(ratio > 0) || !Number.isFinite(ratio)) return null;
  if (ratio === 1) return { ...base };
  return {
    kcal: roundHalfUp(base.kcal * ratio, 0),
    protein: roundHalfUp(base.protein * ratio, 1),
    carbs: roundHalfUp(base.carbs * ratio, 1),
    fat: roundHalfUp(base.fat * ratio, 1),
    fiber: roundHalfUp(base.fiber * ratio, 1),
    salt: roundHalfUp(base.salt * ratio, 1),
  };
}
