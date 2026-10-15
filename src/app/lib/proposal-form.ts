import { favoriteDishFromQuantity } from "@/engine";
import type { FavoriteDishResult } from "@/engine";
import type { DateKey, MealSlot, SaidQuantity } from "@/engine";
import type { FavoriteDish, FavoriteMeal, MealRecord } from "@/data";
import type { FavoriteMention, MealProposal } from "@/modules/ai";
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
  /** Peso in grammi dal modello (non si modifica nella proposta; si porta nel piatto salvato). */
  weightG: number | null;
  note: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  salt: string;
  /** Se il piatto viene da un preferito messo nel testo con un'etichetta: il suo riferimento e la quantità detta (BRIEF §4.1). */
  favorite: { ref: number; said: SaidQuantity; /** Il piatto viene da un pasto preferito (etichetta di pasto): numeri salvati, nessuna quantità. */ meal?: true } | null;
  /** Avviso breve su questo piatto; null se non c'è. */
  warning: string | null;
  /**
   * La domanda «Quanto pesava la porzione salvata?» (BRIEF §4.1, casi AS e AV): c'è per un preferito senza peso di cui sono stati detti i grammi.
   * `grams` sono i grammi detti, `input` la risposta scritta finora, `skipped` se l'utente ha toccato «Salta».
   */
  weightAsk: { grams: number; input: string; skipped: boolean } | null;
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

/** I preferiti messi nel testo, per riferimento: l'app costruisce da questi i piatti delle etichette. */
export type FavoriteRefs = ReadonlyMap<number, FavoriteDish>;

/** I pasti preferiti messi nel testo, per riferimento. */
export type FavoriteMealRefs = ReadonlyMap<number, FavoriteMeal>;

/** Quantità detta dal modello per un preferito: grammi, altrimenti porzioni; null se non detta. */
export function saidFromMention(m: FavoriteMention): SaidQuantity {
  if (!m.quantitySaid) return null;
  if (m.grams !== null) return { unit: "g", amount: m.grams };
  if (m.servings !== null) return { unit: "porzioni", amount: m.servings };
  return null;
}

/** Quante etichette della proposta non corrispondono a nessun preferito conosciuto (eliminato nel frattempo, riferimento sbagliato). */
export function countUnknownMentions(p: MealProposal, refs: FavoriteRefs = new Map(), mealRefs: FavoriteMealRefs = new Map()): number {
  return p.meals.reduce((sum, m) => sum + (m.favorites ?? []).filter((f) => !(f.kind === "pasto" ? mealRefs : refs).has(f.ref)).length, 0);
}

/**
 * La proposta come bozza da controllare. I piatti da etichetta si costruiscono qui dal preferito (BRIEF §4.1), mai dal modello; un'etichetta
 * sconosciuta si scarta (vedi `countUnknownMentions`) e un pasto rimasto senza piatti sparisce.
 */
export function proposalToDrafts(p: MealProposal, refs: FavoriteRefs = new Map(), mealRefs: FavoriteMealRefs = new Map()): MealDraft[] {
  const drafts: MealDraft[] = [];
  p.meals.forEach((m, i) => {
    const dishes: DishDraft[] = m.dishes.map((d, j) => ({
      key: `m${i}d${j}`,
      name: d.name,
      quantity: d.quantity ?? "",
      quantityAssumed: d.quantityAssumed && d.quantity !== null,
      weightG: d.weightG ?? null,
      note: d.note,
      kcal: asText(d.kcal),
      protein: asText(d.protein),
      carbs: asText(d.carbs),
      fat: asText(d.fat),
      fiber: asText(d.fiber),
      salt: asText(d.salt),
      favorite: null,
      warning: null,
      weightAsk: null,
    }));
    (m.favorites ?? []).forEach((f, j) => {
      if (f.kind === "pasto") {
        // Un pasto preferito diventa tutti i suoi piatti, con i numeri salvati; una quantità detta dopo di lui si ignora.
        mealRefs.get(f.ref)?.dishes.forEach((d, k) =>
          dishes.push({
            key: `m${i}f${j}p${k}`,
            name: d.name,
            quantity: d.quantity ?? "",
            quantityAssumed: false,
            weightG: d.weightG ?? null,
            note: "",
            kcal: asText(d.kcal),
            protein: asText(d.protein),
            carbs: asText(d.carbs),
            fat: asText(d.fat),
            fiber: asText(d.fiber),
            salt: asText(d.salt),
            favorite: { ref: f.ref, said: null, meal: true },
            warning: null,
            weightAsk: null,
          }),
        );
        return;
      }
      const fav = refs.get(f.ref);
      if (!fav) return;
      const said = saidFromMention(f);
      const r = favoriteDishFromQuantity({ ...fav, weightG: fav.weightG ?? null }, said);
      dishes.push({
        key: `m${i}f${j}`,
        name: fav.name,
        quantity: r.quantityText,
        quantityAssumed: r.assumed,
        weightG: r.weightG,
        note: r.warning ?? "",
        kcal: asText(r.numbers.kcal),
        protein: asText(r.numbers.protein),
        carbs: asText(r.numbers.carbs),
        fat: asText(r.numbers.fat),
        fiber: asText(r.numbers.fiber),
        salt: asText(r.numbers.salt),
        favorite: { ref: f.ref, said },
        warning: r.warning,
        weightAsk: r.needsWeight && said?.unit === "g" ? { grams: said.amount, input: "", skipped: false } : null,
      });
    });
    if (dishes.length > 0) drafts.push({ key: `m${i}`, slot: m.slot, isFree: m.freeMeal === true, dishes });
  });
  return drafts;
}

const WEIGHT_ASK_MAX_G = 5000;

/** Il peso risposto alla domanda sul preferito: un intero positivo (fino a 5.000 g); altrimenti null. */
export function answeredWeight(ask: DishDraft["weightAsk"]): number | null {
  if (ask === null || ask.skipped) return null;
  const r = parseDecimal(ask.input);
  return r === "empty" || r === "invalid" || !Number.isInteger(r) || r <= 0 || r > WEIGHT_ASK_MAX_G ? null : r;
}

function withResult(d: DishDraft, r: FavoriteDishResult): DishDraft {
  return {
    ...d,
    quantity: r.quantityText,
    quantityAssumed: r.assumed,
    weightG: r.weightG,
    kcal: asText(r.numbers.kcal),
    protein: asText(r.numbers.protein),
    carbs: asText(r.numbers.carbs),
    fat: asText(r.numbers.fat),
    fiber: asText(r.numbers.fiber),
    salt: asText(r.numbers.salt),
    warning: r.warning,
  };
}

/**
 * Risposta (o correzione) alla domanda sul peso: se `input` è un peso valido numeri, quantità e peso del piatto si ricalcolano subito
 * (`r = grammi detti / peso risposto`); se è vuoto o non valido tornano quelli di una porzione.
 */
export function answerWeightAsk(d: DishDraft, fav: FavoriteDish, input: string): DishDraft {
  if (d.weightAsk === null || d.favorite === null) return d;
  const ask = { ...d.weightAsk, input, skipped: false };
  const w = answeredWeight(ask);
  const r = favoriteDishFromQuantity({ ...fav, weightG: w }, d.favorite.said);
  return { ...withResult(d, r), weightAsk: ask };
}

/** «Salta»: la domanda sparisce e il piatto resta com'era senza risposta (`r = 1`, «1 porzione»). */
export function skipWeightAsk(d: DishDraft, fav: FavoriteDish): DishDraft {
  if (d.weightAsk === null || d.favorite === null) return d;
  const r = favoriteDishFromQuantity({ ...fav, weightG: null }, d.favorite.said);
  return { ...withResult(d, r), weightAsk: { ...d.weightAsk, input: "", skipped: true } };
}

/** I preferiti che prendono il peso risposto: solo alla conferma della proposta, per i piatti rimasti e con una risposta valida. */
export function favoritesToUpdate(drafts: readonly MealDraft[], refs: FavoriteRefs): FavoriteDish[] {
  const updates = new Map<string, FavoriteDish>();
  for (const m of drafts) {
    for (const d of m.dishes) {
      const w = answeredWeight(d.weightAsk);
      const fav = d.favorite ? refs.get(d.favorite.ref) : undefined;
      if (w !== null && fav) updates.set(fav.id, { ...fav, weightG: w });
    }
  }
  return [...updates.values()];
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
      dishes.push({ name: d.name.trim() || "Piatto", quantity: d.quantity.trim() || null, quantityAssumed: d.quantityAssumed && d.quantity.trim() !== "", weightG: d.weightG, note: d.note, ...nums });
    }
    if (dishes.length > 0) meals.push({ slot: m.slot, freeMeal: m.isFree, dishes });
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, proposal: { meals } };
}

/**
 * La bozza come stima precedente da mandare al modello con una correzione a parole: i piatti stimati con i loro numeri, i piatti da etichetta come
 * semplici riferimenti con la quantità detta (il modello non vede i numeri dei preferiti). Null se i numeri scritti a mano non sono validi.
 */
export function draftsToPrevious(drafts: readonly MealDraft[]): MealProposal | null {
  const meals: MealProposal["meals"] = [];
  for (const m of drafts) {
    const own = draftsToProposal([{ ...m, dishes: m.dishes.filter((d) => d.favorite === null) }]);
    if (!own.ok) return null;
    const seenMeals = new Set<number>();
    const favorites: FavoriteMention[] = m.dishes.flatMap((d) => {
      if (d.favorite === null) return [];
      if (d.favorite.meal) {
        // Un pasto preferito va al modello una volta sola, come riferimento: i suoi piatti non sono stime.
        if (seenMeals.has(d.favorite.ref)) return [];
        seenMeals.add(d.favorite.ref);
        return [{ ref: d.favorite.ref, kind: "pasto" as const, quantitySaid: false, grams: null, servings: null }];
      }
      const said = d.favorite.said;
      return [{ ref: d.favorite.ref, quantitySaid: said !== null, grams: said?.unit === "g" ? said.amount : null, servings: said?.unit === "porzioni" ? said.amount : null }];
    });
    const dishes = own.proposal.meals[0]?.dishes ?? [];
    if (dishes.length === 0 && favorites.length === 0) continue;
    meals.push({ slot: m.slot, freeMeal: m.isFree, dishes, ...(favorites.length > 0 ? { favorites } : {}) });
  }
  return { meals };
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
      weightG: d.weightG ?? null,
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
export function sumProposal(proposal: MealProposal): Record<DishNumberKey, number> & { notes: string[]; weightG: number | null } {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 };
  const notes: string[] = [];
  let weightG: number | null = null;
  for (const m of proposal.meals) {
    for (const d of m.dishes) {
      for (const k of DISH_NUMBER_KEYS) total[k] += d[k];
      if (d.note) notes.push(d.note);
      if (d.weightG) weightG = (weightG ?? 0) + d.weightG;
    }
  }
  for (const k of DISH_NUMBER_KEYS) total[k] = k === "kcal" ? Math.round(total[k]) : Math.round(total[k] * 10) / 10;
  return { ...total, notes, weightG };
}

/** Con la fascia fissata (si è partiti da "Aggiungi piatto" di un pasto) tutti i piatti proposti vanno in quella fascia, anche se il modello ne ha indicata un'altra. */
export function forceSlot(proposal: MealProposal, slot: MealSlot): MealProposal {
  const dishes = proposal.meals.flatMap((m) => m.dishes);
  const favorites = proposal.meals.flatMap((m) => m.favorites ?? []);
  return dishes.length === 0 && favorites.length === 0 ? proposal : { meals: [{ slot, freeMeal: false, dishes, ...(favorites.length > 0 ? { favorites } : {}) }] };
}
