import { needsKcalCheck } from "@/engine";
import type { MealSlot } from "@/engine";

/** Valori dei campi del modulo pasto, così come scritti dall'utente. */
export interface MealFormValues {
  name: string;
  quantity: string;
  slot: MealSlot;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  salt: string;
  isFree: boolean;
}

export type MealFieldKey = "kcal" | "protein" | "carbs" | "fat" | "fiber" | "salt" | "isFree";
export type MealFormErrors = Partial<Record<MealFieldKey, string>>;

export interface ParsedMeal {
  name: string;
  /** Quantità in testo libero; null se non indicata. */
  quantity: string | null;
  slot: MealSlot;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
  isFree: boolean;
}

export const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "colazione", label: "Colazione" },
  { value: "pranzo", label: "Pranzo" },
  { value: "cena", label: "Cena" },
  { value: "spuntino", label: "Spuntino" },
];

export const DEFAULT_MEAL_NAME = "Piatto";

export function emptyMealForm(slot: MealSlot = "pranzo"): MealFormValues {
  return { name: "", quantity: "", slot, kcal: "", protein: "", carbs: "", fat: "", fiber: "", salt: "", isFree: false };
}

const asText = (n: number) => String(n).replace(".", ",");

export function mealToForm(m: Omit<ParsedMeal, "quantity"> & { quantity?: string | null }): MealFormValues {
  return {
    name: m.name,
    quantity: m.quantity ?? "",
    slot: m.slot,
    kcal: asText(m.kcal),
    protein: m.protein ? asText(m.protein) : "",
    carbs: m.carbs ? asText(m.carbs) : "",
    fat: m.fat ? asText(m.fat) : "",
    fiber: m.fiber ? asText(m.fiber) : "",
    salt: m.salt ? asText(m.salt) : "",
    isFree: m.isFree,
  };
}

/** Numero scritto all'italiana ("12,5") o all'inglese ("12.5"). Vuoto: "empty". Non valido: "invalid". */
export function parseDecimal(text: string): number | "empty" | "invalid" {
  const t = text.trim().replace(",", ".");
  if (t === "") return "empty";
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(t)) return "invalid";
  const n = Number(t);
  return Number.isFinite(n) ? n : "invalid";
}

/** Frase mostrata accanto a una stima dell'AI che non supera il controllo di coerenza (BRIEF §3.7). */
export const KCAL_CHECK_MESSAGE = "Calorie basse rispetto ai nutrienti: controlla i numeri.";

/**
 * Il controllo di coerenza sui numeri scritti come testo (si ricalcola a ogni ritocco). Senza kcal valide non c'è nulla da controllare;
 * proteine, carboidrati e grassi vuoti o non validi valgono 0. Vale solo per i piatti stimati dal modello, non per i numeri scritti a mano.
 */
export function textNeedsKcalCheck(v: { kcal: string; protein: string; carbs: string; fat: string }): boolean {
  const num = (t: string): number | null => {
    const r = parseDecimal(t);
    return r === "empty" ? 0 : r === "invalid" || r < 0 ? null : r;
  };
  const kcal = parseDecimal(v.kcal);
  if (kcal === "empty" || kcal === "invalid" || kcal < 0) return false;
  const protein = num(v.protein);
  const carbs = num(v.carbs);
  const fat = num(v.fat);
  if (protein === null || carbs === null || fat === null) return false;
  return needsKcalCheck({ kcal, protein, carbs, fat });
}

/**
 * Controlla il modulo. Solo le kcal sono obbligatorie (con la stima automatica attiva si possono ottenere dal nome e dalla quantità); gli altri numeri vuoti valgono 0;
 * il nome vuoto diventa "Piatto". Il pasto libero è accettato solo se `freeAllowed`.
 */
export function validateMealForm(
  values: MealFormValues,
  freeAllowed: boolean,
  aiAvailable = false,
): { ok: true; meal: ParsedMeal } | { ok: false; errors: MealFormErrors } {
  const errors: MealFormErrors = {};
  const nums: Record<"kcal" | "protein" | "carbs" | "fat" | "fiber" | "salt", number> = {
    kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0,
  };
  for (const key of ["kcal", "protein", "carbs", "fat", "fiber", "salt"] as const) {
    const r = parseDecimal(values[key]);
    if (r === "empty") {
      if (key === "kcal") errors.kcal = aiAvailable ? "Inserisci le calorie o tocca «Stima con l'AI»" : "Inserisci le calorie";
    } else if (r === "invalid") {
      errors[key] = "Inserisci un numero valido";
    } else if (r < 0) {
      errors[key] = "Non può essere negativo";
    } else {
      nums[key] = r;
    }
  }
  if (values.isFree && !freeAllowed) errors.isFree = "Già usato questa settimana.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    meal: { name: values.name.trim() || DEFAULT_MEAL_NAME, quantity: values.quantity.trim() || null, slot: values.slot, isFree: values.isFree, ...nums },
  };
}
