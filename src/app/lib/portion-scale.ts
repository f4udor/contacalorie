import { scaleNutrients, weightRatio } from "@/engine";
import type { ScalableNumbers } from "@/engine";
import { parseDecimal } from "./meal-form";
import type { MealFormValues } from "./meal-form";
import type { DishNumberKey } from "./proposal-form";
import { DISH_NUMBER_KEYS } from "./proposal-form";

/** Le scelte rapide delle porzioni (BRIEF §4.1). */
export const SERVING_CHOICES = [0.5, 1, 1.5, 2] as const;

/** Come si scrive un numero delle porzioni («1,5»). */
export const servingsText = (n: number): string => String(n).replace(".", ",");

/** I numeri di partenza di un piatto: dai valori della scheda al momento in cui si comincia a cambiare la quantità. */
export interface ScaleBase {
  /** Numero di partenza di ogni campo; null se il campo era vuoto o non valido (non si tocca). */
  numbers: Record<DishNumberKey, number | null>;
  /** Peso di partenza in grammi; null se il piatto non aveva un peso valido. */
  weightG: number | null;
}

/** Lo stato del ricalcolo: i valori di partenza e i campi scritti a mano dopo un ricalcolo (restano com'è). */
export interface ScaleState {
  base: ScaleBase | null;
  manual: readonly DishNumberKey[];
}

export const NO_SCALE: ScaleState = { base: null, manual: [] };

/** Il peso del modulo come intero positivo; vuoto, non valido o non intero → null. */
export function parseWeightG(text: string): number | null {
  const r = parseDecimal(text);
  return r === "empty" || r === "invalid" || !Number.isInteger(r) || r <= 0 ? null : r;
}

const numberOrNull = (text: string): number | null => {
  const r = parseDecimal(text);
  return r === "empty" || r === "invalid" || r < 0 ? null : r;
};

/** I valori di partenza dalla scheda; null se non ci sono kcal valide (non c'è nulla da ricalcolare). */
export function snapshotBase(values: MealFormValues): ScaleBase | null {
  const numbers = Object.fromEntries(DISH_NUMBER_KEYS.map((k) => [k, numberOrNull(values[k])])) as Record<DishNumberKey, number | null>;
  if (numbers.kcal === null) return null;
  return { numbers, weightG: parseWeightG(values.weightG) };
}

const asText = (n: number) => String(n).replace(".", ",");

/** Come `mealToForm`: le kcal si scrivono sempre, gli altri numeri a zero restano vuoti. */
function fieldText(key: DishNumberKey, n: number): string {
  return key === "kcal" ? asText(n) : n ? asText(n) : "";
}

/**
 * Ricalcola kcal e nutrienti dalla base con il rapporto `ratio` (mai dai valori già ricalcolati: 200 → 250 → 200 riporta i numeri di partenza).
 * I campi scritti a mano dopo un ricalcolo (`manual`) e quelli che erano vuoti restano come sono. Se `scaleWeight` e la base ha un peso, anche il peso
 * si ricalcola. Senza base valida o con un rapporto non valido, i valori non cambiano.
 */
export function rescale(values: MealFormValues, state: ScaleState, ratio: number | null, scaleWeight = false): { values: MealFormValues; state: ScaleState } {
  const base = state.base ?? snapshotBase(values);
  if (base === null || ratio === null) return { values, state: base === null ? state : { ...state, base } };
  const filled = Object.fromEntries(DISH_NUMBER_KEYS.map((k) => [k, base.numbers[k] ?? 0])) as unknown as ScalableNumbers;
  const scaled = scaleNutrients(filled, ratio);
  if (scaled === null) return { values, state: { ...state, base } };
  const next = { ...values };
  for (const k of DISH_NUMBER_KEYS) {
    if (state.manual.includes(k) || base.numbers[k] === null) continue;
    next[k] = fieldText(k, scaled[k]);
  }
  if (scaleWeight && base.weightG !== null) next.weightG = String(Math.round(base.weightG * ratio));
  return { values: next, state: { ...state, base } };
}

/**
 * Il peso scritto nel campo «Peso (g)» di un piatto che aveva un peso: ricalcola kcal e nutrienti in proporzione al peso di partenza.
 * Un peso non valido (vuoto o a metà scrittura) lascia i numeri come sono. Un piatto senza peso di partenza prende solo il nuovo peso.
 */
export function rescaleByWeight(values: MealFormValues, state: ScaleState, newWeightText: string): { values: MealFormValues; state: ScaleState } {
  const base = state.base ?? snapshotBase(values);
  const withWeight = { ...values, weightG: newWeightText };
  if (base === null || base.weightG === null) return { values: withWeight, state };
  const w = parseWeightG(newWeightText);
  const ratio = w === null ? null : weightRatio(base.weightG, w);
  const r = rescale(withWeight, { ...state, base }, ratio);
  return r;
}

/** Il rapporto delle porzioni scritte («1,5»); null se vuote o non valide (zero e negativi compresi). */
export function servingsRatio(text: string): number | null {
  const r = parseDecimal(text);
  return r === "empty" || r === "invalid" || r <= 0 ? null : r;
}

/** Porzioni: kcal e nutrienti (e il peso, se c'è) = valori di partenza × porzioni. */
export function rescaleByServings(values: MealFormValues, state: ScaleState, servingsInput: string): { values: MealFormValues; state: ScaleState } {
  return rescale(values, state, servingsRatio(servingsInput), true);
}

/** Un numero nutrizionale è stato scritto a mano: dopo un ricalcolo resta com'è, anche cambiando ancora la quantità. */
export function markManual(state: ScaleState, keys: readonly DishNumberKey[]): ScaleState {
  if (state.base === null) return state;
  const add = keys.filter((k) => !state.manual.includes(k));
  return add.length === 0 ? state : { ...state, manual: [...state.manual, ...add] };
}
