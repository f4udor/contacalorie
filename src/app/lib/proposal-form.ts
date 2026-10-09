import type { DateKey, MealSlot } from "@/engine";
import type { MealRecord } from "@/data";
import type { MealProposal } from "@/modules/ai";
import { parseDecimal } from "./meal-form";

export type DishNumberKey = "kcal" | "protein" | "carbs" | "fat" | "fiber" | "salt";
export const DISH_NUMBER_KEYS: readonly DishNumberKey[] = ["kcal", "protein", "carbs", "fat", "fiber", "salt"];

/** Un piatto della proposta così come lo vede e lo modifica l'utente (numeri come testo). */
export interface DishDraft {
  key: string;
  name: string;
  quantity: string;
  /** Vero finché la quantità è quella ipotizzata dal modello. */
  quantityAssumed: boolean;
  note: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  salt: string;
}

export interface MealDraft {
  key: string;
  slot: MealSlot;
  /** Pasto libero (l'interruttore della conferma). */
  isFree: boolean;
  dishes: DishDraft[];
}

/** Ciò che serve per decidere sul pasto libero: sono le stesse regole dell'inserimento a mano. */
export interface FreeRules {
  /** Il pasto di quella fascia può essere libero (falso se la settimana ha già un altro pasto libero). */
  freeAllowedFor: (slot: MealSlot) => boolean;
  /** Il pasto di quella fascia, nel giorno, è già libero. */
  mealIsFreeFor: (slot: MealSlot) => boolean;
}

const asText = (n: number) => String(n).replace(".", ",");

export function proposalToDrafts(p: MealProposal): MealDraft[] {
  return p.meals.map((m, i) => ({
    key: `m${i}`,
    slot: m.slot,
    isFree: m.freeMeal === true,
    dishes: m.dishes.map((d, j) => ({
      key: `m${i}d${j}`,
      name: d.name,
      quantity: d.quantity ?? "",
      quantityAssumed: d.quantityAssumed && d.quantity !== null,
      note: d.note,
      kcal: asText(d.kcal),
      protein: asText(d.protein),
      carbs: asText(d.carbs),
      fat: asText(d.fat),
      fiber: asText(d.fiber),
      salt: asText(d.salt),
    })),
  }));
}

/**
 * Stato iniziale dell'interruttore "Pasto libero" di ogni pasto proposto: acceso se il pasto di quella fascia è già libero,
 * oppure se il modello lo ha segnalato (`useModelFlag`), la settimana lo consente e nella proposta non ce n'è già un altro acceso.
 * Con la fascia fissata il segnale del modello non conta: l'interruttore segue lo stato del pasto esistente.
 */
export function withInitialFree(drafts: readonly MealDraft[], rules: FreeRules, useModelFlag: boolean): MealDraft[] {
  let taken = false;
  return drafts.map((m) => {
    const existing = rules.mealIsFreeFor(m.slot);
    const fromModel = useModelFlag && m.isFree && !taken && rules.freeAllowedFor(m.slot);
    const isFree = existing || fromModel;
    if (isFree) taken = true;
    return { ...m, isFree };
  });
}

/** Perché l'interruttore di un pasto è bloccato (null se si può usare). Un pasto già acceso si può sempre spegnere. */
export function freeSwitchBlock(drafts: readonly MealDraft[], key: string, rules: FreeRules): "settimana" | "proposta" | null {
  const meal = drafts.find((m) => m.key === key);
  if (!meal || meal.isFree) return null;
  if (!rules.freeAllowedFor(meal.slot)) return "settimana";
  if (drafts.some((m) => m.key !== key && m.isFree)) return "proposta";
  return null;
}

/** Se si cambia la fascia di un pasto proposto, l'interruttore ne segue lo stato (come nell'inserimento a mano). */
export function withSlot(drafts: readonly MealDraft[], key: string, slot: MealSlot, rules: FreeRules): MealDraft[] {
  return drafts.map((m) => (m.key === key ? { ...m, slot, isFree: rules.mealIsFreeFor(slot) } : m));
}

export type DraftErrors = Record<string, Partial<Record<DishNumberKey, string>>>;

export function hasDishes(drafts: readonly MealDraft[]): boolean {
  return drafts.some((m) => m.dishes.length > 0);
}

/** Controlla i numeri scritti dall'utente (kcal obbligatorie, gli altri vuoti valgono 0) e li trasforma in proposta. */
export function draftsToProposal(drafts: readonly MealDraft[]): { ok: true; proposal: MealProposal } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const meals: MealProposal["meals"] = [];
  for (const m of drafts) {
    const dishes: MealProposal["meals"][number]["dishes"] = [];
    for (const d of m.dishes) {
      const nums = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 };
      for (const k of DISH_NUMBER_KEYS) {
        const r = parseDecimal(d[k]);
        if (r === "empty") {
          if (k === "kcal") (errors[d.key] ??= {}).kcal = "Inserisci le calorie";
        } else if (r === "invalid") (errors[d.key] ??= {})[k] = "Inserisci un numero valido";
        else if (r < 0) (errors[d.key] ??= {})[k] = "Non può essere negativo";
        else nums[k] = r;
      }
      dishes.push({ name: d.name.trim() || "Piatto", quantity: d.quantity.trim() || null, quantityAssumed: d.quantityAssumed && d.quantity.trim() !== "", note: d.note, ...nums });
    }
    if (dishes.length > 0) meals.push({ slot: m.slot, freeMeal: m.isFree, dishes });
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, proposal: { meals } };
}

/** I piatti da salvare: ognuno conserva il testo originale. L'ordine è quello della proposta. */
export function proposalToRecords(proposal: MealProposal, date: DateKey, originalText: string, newId: () => string): MealRecord[] {
  return proposal.meals.flatMap((m) =>
    m.dishes.map((d) => ({
      id: newId(),
      date,
      slot: m.slot,
      name: d.name,
      quantity: d.quantity,
      kcal: d.kcal,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      fiber: d.fiber,
      salt: d.salt,
      isFree: m.freeMeal === true,
      originalText,
    })),
  );
}

/** Somma di tutti i piatti della proposta (per riempire i numeri di un solo piatto scritto a mano). */
export function sumProposal(proposal: MealProposal): Record<DishNumberKey, number> & { notes: string[] } {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 };
  const notes: string[] = [];
  for (const m of proposal.meals) {
    for (const d of m.dishes) {
      for (const k of DISH_NUMBER_KEYS) total[k] += d[k];
      if (d.note) notes.push(d.note);
    }
  }
  for (const k of DISH_NUMBER_KEYS) total[k] = k === "kcal" ? Math.round(total[k]) : Math.round(total[k] * 10) / 10;
  return { ...total, notes };
}

/** Con la fascia fissata (si è partiti da "Aggiungi piatto" di un pasto) tutti i piatti proposti vanno in quella fascia, anche se il modello ne ha indicata un'altra. */
export function forceSlot(proposal: MealProposal, slot: MealSlot): MealProposal {
  const dishes = proposal.meals.flatMap((m) => m.dishes);
  return dishes.length === 0 ? proposal : { meals: [{ slot, freeMeal: false, dishes }] };
}
