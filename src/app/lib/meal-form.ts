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

/**
 * Controlla il modulo. Solo le kcal sono obbligatorie; gli altri numeri vuoti valgono 0;
 * il nome vuoto diventa "Piatto". Il pasto libero è accettato solo se `freeAllowed`.
 */
export function validateMealForm(
  values: MealFormValues,
  freeAllowed: boolean,
): { ok: true; meal: ParsedMeal } | { ok: false; errors: MealFormErrors } {
  const errors: MealFormErrors = {};
  const nums: Record<"kcal" | "protein" | "carbs" | "fat" | "fiber" | "salt", number> = {
    kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0,
  };
  for (const key of ["kcal", "protein", "carbs", "fat", "fiber", "salt"] as const) {
    const r = parseDecimal(values[key]);
    if (r === "empty") {
      if (key === "kcal") errors.kcal = "Inserisci le kcal";
    } else if (r === "invalid") {
      errors[key] = "Inserisci un numero valido";
    } else if (r < 0) {
      errors[key] = "Non può essere negativo";
    } else {
      nums[key] = r;
    }
  }
  if (values.isFree && !freeAllowed) errors.isFree = "Il pasto libero di questa settimana è già stato usato";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    meal: { name: values.name.trim() || DEFAULT_MEAL_NAME, quantity: values.quantity.trim() || null, slot: values.slot, isFree: values.isFree, ...nums },
  };
}
