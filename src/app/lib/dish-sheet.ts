import type { MealProposal } from "@/modules/ai";
import { parseDecimal } from "./meal-form";
import type { MealFormValues } from "./meal-form";
import { DISH_NUMBER_KEYS, sumProposal } from "./proposal-form";
import type { DishNumberKey } from "./proposal-form";

const asText = (n: number) => String(n).replace(".", ",");

const TEXT_KEYS = ["name", "quantity", "kcal", "protein", "carbs", "fat", "fiber", "salt"] as const;

/** Nel modulo c'è scritto qualcosa (nome, quantità o un numero). */
export function hasWritten(v: MealFormValues): boolean {
  return TEXT_KEYS.some((k) => v[k].trim() !== "");
}

/** Il modulo è cambiato rispetto a com'era all'apertura. */
export function isDirty(v: MealFormValues, initial: MealFormValues): boolean {
  return TEXT_KEYS.some((k) => v[k].trim() !== initial[k].trim()) || v.slot !== initial.slot || v.isFree !== initial.isFree;
}

/**
 * "Salva" della scheda del piatto a mano è attivo solo se c'è qualcosa da salvare: in aggiunta (`initial` assente) quando è stato scritto
 * qualcosa; in modifica quando qualcosa è cambiato. Mentre si salva o si stima è disattivato.
 */
export function canSaveDish(v: MealFormValues, initial: MealFormValues | null, busy = false): boolean {
  if (busy) return false;
  return initial === null ? hasWritten(v) : isDirty(v, initial);
}

/** Il piatto del modulo come stima precedente da correggere (numeri vuoti o non validi valgono 0). */
export function valuesToProposal(v: MealFormValues): MealProposal {
  const num = (t: string) => {
    const r = parseDecimal(t);
    return r === "empty" || r === "invalid" || r < 0 ? 0 : r;
  };
  return {
    meals: [
      {
        slot: v.slot,
        freeMeal: v.isFree,
        dishes: [
          {
            name: v.name.trim() || "Piatto",
            quantity: v.quantity.trim() || null,
            quantityAssumed: false,
            note: "",
            kcal: num(v.kcal),
            protein: num(v.protein),
            carbs: num(v.carbs),
            fat: num(v.fat),
            fiber: num(v.fiber),
            salt: num(v.salt),
          },
        ],
      },
    ],
  };
}

/** Il testo da cui far ripartire la stima di un piatto: quello originale, se c'è, altrimenti nome e quantità. */
export function estimateSourceText(v: MealFormValues, originalText: string | null): string {
  if (originalText && originalText.trim() !== "") return originalText;
  const n = v.name.trim();
  const q = v.quantity.trim();
  return q ? `${n}, ${q}` : n;
}

/** Mette nel modulo i numeri di una nuova stima, sostituendo quelli che c'erano; il resto (fascia, pasto libero) non cambia. */
export function applyNumbers(v: MealFormValues, numbers: Record<DishNumberKey, number>): MealFormValues {
  const next = { ...v };
  for (const k of DISH_NUMBER_KEYS) next[k] = asText(numbers[k]);
  return next;
}

/**
 * Applica al modulo la stima corretta: con un solo piatto prende anche nome e quantità del modello, con più piatti somma i numeri
 * e lascia nome e quantità come sono (come "Stima con l'AI" del piatto a mano).
 */
export function applyCorrection(v: MealFormValues, proposal: MealProposal): { values: MealFormValues; note: string } {
  const dishes = proposal.meals.flatMap((m) => m.dishes);
  const { notes, ...numbers } = sumProposal(proposal);
  const withNumbers = applyNumbers(v, numbers);
  if (dishes.length === 1) {
    const d = dishes[0];
    return { values: { ...withNumbers, name: d.name, quantity: d.quantity ?? "" }, note: notes.join(" ") };
  }
  return { values: withNumbers, note: notes.join(" ") };
}
