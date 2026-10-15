import { MEAL_SLOTS } from "@/engine";
import type { MealSlot } from "@/engine";
import { AiError } from "./types";
import type { EstimatedDish, EstimatedMeal, FavoriteMention, MealProposal } from "./types";

const MAX_KCAL = 5000;
const MAX_GRAMS = 1000;
const MAX_TEXT = 200;
/** Peso del piatto in grammi: oltre questo valore (o a zero o negativo) il peso si scarta, il piatto resta. */
const MAX_WEIGHT_G = 5000;
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

/** Il peso in grammi (intero, > 0 e ≤ 5.000); assente o non valido → null (il peso è facoltativo e un valore sbagliato si scarta senza scartare il piatto). */
function weightOf(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const g = Math.round(v);
  return g > 0 && g <= MAX_WEIGHT_G ? g : null;
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
  return { name, quantity, quantityAssumed: raw.quantityAssumed, weightG: weightOf(raw.weightG), kcal, protein, carbs, fat, fiber, salt, note: (raw.note ?? "").trim().slice(0, 400) };
}

const MAX_REF = 99;
const MAX_SAID_GRAMS = 20000;
const MAX_SAID_SERVINGS = 100;

const positive = (v: unknown, max: number): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max ? Math.round(v * 100) / 100 : null);

/** Un preferito messo nel pasto: riferimento intero da 1; grammi e porzioni positivi o null. Un valore non valido vale «quantità non detta». */
function mention(raw: unknown): FavoriteMention | null {
  if (!isObject(raw)) return null;
  const ref = raw.ref;
  if (typeof ref !== "number" || !Number.isInteger(ref) || ref < 1 || ref > MAX_REF) return null;
  const grams = positive(raw.grams, MAX_SAID_GRAMS);
  const servings = positive(raw.servings, MAX_SAID_SERVINGS);
  const said = raw.quantitySaid === true && (grams !== null || servings !== null);
  const pasto = raw.kind === "pasto";
  return { ref, ...(pasto ? { kind: "pasto" as const } : {}), quantitySaid: said, grams: said ? grams : null, servings: said && grams === null ? servings : null };
}

/** Controlla la proposta (risposta del modello o stima precedente ricevuta dal browser). Restituisce null se non è valida. */
export function parseProposal(raw: unknown): MealProposal | null {
  if (!isObject(raw) || !Array.isArray(raw.meals) || raw.meals.length === 0) return null;
  const meals: EstimatedMeal[] = [];
  for (const m of raw.meals) {
    if (!isObject(m) || typeof m.slot !== "string" || !(MEAL_SLOTS as readonly string[]).includes(m.slot)) return null;
    // `freeMeal` può mancare (stime precedenti più vecchie): vale falso. Se c'è, deve essere un booleano.
    if (m.freeMeal !== undefined && typeof m.freeMeal !== "boolean") return null;
    if (!Array.isArray(m.dishes)) return null;
    // `favorites` può mancare (stime più vecchie e risposte senza etichette): vale nessuno. Se c'è, deve essere un elenco di preferiti validi.
    if (m.favorites !== undefined && m.favorites !== null && !Array.isArray(m.favorites)) return null;
    const favorites: FavoriteMention[] = [];
    for (const f of (m.favorites as unknown[] | undefined | null) ?? []) {
      const ok = mention(f);
      if (!ok) return null;
      favorites.push(ok);
    }
    if (m.dishes.length === 0 && favorites.length === 0) return null;
    const dishes: EstimatedDish[] = [];
    for (const d of m.dishes) {
      const ok = dish(d);
      if (!ok) return null;
      dishes.push(ok);
    }
    meals.push({ slot: m.slot as MealSlot, freeMeal: m.freeMeal === true, dishes, ...(favorites.length > 0 ? { favorites } : {}) });
  }
  return { meals };
}

/** Come `parseProposal`, ma lancia un errore chiaro se la risposta non è valida: in quel caso nulla va salvato. */
export function validateProposal(raw: unknown): MealProposal {
  const p = parseProposal(raw);
  if (!p) throw new AiError("non-valida");
  return p;
}
