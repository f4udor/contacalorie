import { MEAL_SLOTS } from "@/engine";
import type { MealSlot } from "@/engine";
import { AiError } from "./types";
import type { EstimatedDish, EstimatedMeal, MealProposal } from "./types";

const MAX_KCAL = 5000;
const MAX_GRAMS = 1000;
const MAX_TEXT = 200;
/** Quantità: l'elenco degli ingredienti principali con i grammi. */
const MAX_QUANTITY = 500;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function amount(v: unknown, max: number, decimals: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max) return null;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

function dish(raw: unknown): EstimatedDish | null {
  if (!isObject(raw)) return null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (name === "" || name.length > MAX_TEXT) return null;
  if (raw.quantity !== null && raw.quantity !== undefined && typeof raw.quantity !== "string") return null;
  const quantity = typeof raw.quantity === "string" && raw.quantity.trim() !== "" ? raw.quantity.trim().slice(0, MAX_QUANTITY) : null;
  if (typeof raw.quantityAssumed !== "boolean") return null;
  if (raw.note !== undefined && typeof raw.note !== "string") return null;
  const kcal = amount(raw.kcal, MAX_KCAL, 0);
  const protein = amount(raw.protein, MAX_GRAMS, 1);
  const carbs = amount(raw.carbs, MAX_GRAMS, 1);
  const fat = amount(raw.fat, MAX_GRAMS, 1);
  const fiber = amount(raw.fiber, MAX_GRAMS, 1);
  const salt = amount(raw.salt, MAX_GRAMS, 1);
  if (kcal === null || protein === null || carbs === null || fat === null || fiber === null || salt === null) return null;
  return { name, quantity, quantityAssumed: raw.quantityAssumed, kcal, protein, carbs, fat, fiber, salt, note: (raw.note ?? "").trim().slice(0, 400) };
}

/** Controlla la proposta (risposta del modello o stima precedente ricevuta dal browser). Restituisce null se non è valida. */
export function parseProposal(raw: unknown): MealProposal | null {
  if (!isObject(raw) || !Array.isArray(raw.meals) || raw.meals.length === 0) return null;
  const meals: EstimatedMeal[] = [];
  for (const m of raw.meals) {
    if (!isObject(m) || typeof m.slot !== "string" || !(MEAL_SLOTS as readonly string[]).includes(m.slot)) return null;
    // `freeMeal` può mancare (stime precedenti più vecchie): vale falso. Se c'è, deve essere un booleano.
    if (m.freeMeal !== undefined && typeof m.freeMeal !== "boolean") return null;
    if (!Array.isArray(m.dishes) || m.dishes.length === 0) return null;
    const dishes: EstimatedDish[] = [];
    for (const d of m.dishes) {
      const ok = dish(d);
      if (!ok) return null;
      dishes.push(ok);
    }
    meals.push({ slot: m.slot as MealSlot, freeMeal: m.freeMeal === true, dishes });
  }
  return { meals };
}

/** Come `parseProposal`, ma lancia un errore chiaro se la risposta non è valida: in quel caso nulla va salvato. */
export function validateProposal(raw: unknown): MealProposal {
  const p = parseProposal(raw);
  if (!p) throw new AiError("non-valida");
  return p;
}
