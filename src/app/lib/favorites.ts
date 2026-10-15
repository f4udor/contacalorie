import type { DateKey, MealSlot } from "@/engine";
import { mealToForm, parseDecimal } from "./meal-form";
import type { MealFormValues, ParsedMeal } from "./meal-form";
import type { DataStore, DishBody, FavoriteDish, FavoriteMeal, MealRecord } from "@/data";

const MAX_NAME = 40;

type NameAndQuantity = { name: string; quantity?: string | null };

/** Minuscole e senza accenti, per cercare "caffe" e trovare "Caffè". */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function dishBody(d: Pick<MealRecord, keyof DishBody>): DishBody {
  return { name: d.name, quantity: d.quantity ?? null, weightG: d.weightG ?? null, kcal: d.kcal, protein: d.protein, carbs: d.carbs, fat: d.fat, fiber: d.fiber, salt: d.salt };
}

/** Nome proposto per un pasto salvato: i nomi dei piatti separati da virgola, accorciato. */
export function defaultMealName(dishes: readonly Pick<MealRecord, "name">[]): string {
  const joined = dishes.map((d) => d.name.trim()).filter(Boolean).join(", ");
  if (joined === "") return "Pasto";
  return joined.length > MAX_NAME ? `${joined.slice(0, MAX_NAME - 1).trimEnd()}…` : joined;
}

/** Per riconoscere "lo stesso" testo: senza maiuscole e con gli spazi ripetuti, in testa e in coda ridotti. Gli accenti contano. */
export function sameKey(text: string | null | undefined): string {
  return (text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Un piatto è "lo stesso" se ha lo stesso nome e la stessa quantità (senza badare a maiuscole e spazi): è così che si sa se è tra i preferiti. */
export function sameDish(a: NameAndQuantity, b: NameAndQuantity): boolean {
  return sameKey(a.name) === sameKey(b.name) && sameKey(a.quantity) === sameKey(b.quantity);
}

/** Il piatto è tra i preferiti. */
export function isFavoriteDish(favorites: readonly NameAndQuantity[], dish: NameAndQuantity): boolean {
  return favorites.some((f) => sameDish(f, dish));
}

/**
 * Preferiti di un piatto con un tocco: se è già tra i preferiti lo toglie (anche i doppioni già esistenti, altrimenti l'etichetta non cambierebbe),
 * altrimenti lo salva. Un piatto già presente non crea mai una seconda riga. Restituisce cosa è successo.
 */
export async function toggleFavoriteDish(store: DataStore, dish: Pick<MealRecord, keyof DishBody>, makeId: () => string): Promise<"salvato" | "rimosso"> {
  const existing = await store.listFavoriteDishes();
  const same = existing.filter((f) => sameDish(f, dish));
  if (same.length > 0) {
    for (const f of same) await store.deleteFavoriteDish(f.id);
    return "rimosso";
  }
  await store.saveFavoriteDish(favoriteForDish(existing, dish, makeId).favorite);
  return "salvato";
}

/** Il preferito da salvare per un piatto: se ce n'è già uno uguale lo sostituisce (stesso id). */
export function favoriteForDish(existing: readonly FavoriteDish[], dish: Pick<MealRecord, keyof DishBody>, makeId: () => string): { favorite: FavoriteDish; updated: boolean } {
  const body = dishBody(dish);
  const same = existing.find((f) => sameDish(f, body));
  return { favorite: { id: same?.id ?? makeId(), ...body }, updated: same !== undefined };
}

/** Il preferito da salvare per un pasto; lo stesso nome sostituisce il pasto già salvato. */
export function favoriteForMeal(existing: readonly FavoriteMeal[], name: string, slot: MealSlot, dishes: readonly MealRecord[], makeId: () => string): { favorite: FavoriteMeal; updated: boolean } {
  const clean = name.trim() || defaultMealName(dishes);
  const same = existing.find((f) => sameKey(f.name) === sameKey(clean));
  return { favorite: { id: same?.id ?? makeId(), name: clean, slot, dishes: dishes.map(dishBody) }, updated: same !== undefined };
}

function toRecord(body: DishBody, date: DateKey, slot: MealSlot, makeId: () => string): MealRecord {
  return { id: makeId(), date, slot, ...body, isFree: false, originalText: null };
}

/** I piatti da aggiungere al giorno e alla fascia scelti: sempre normali (il segno "libero" lo decide il pasto). */
export function recordsFromFavoriteDish(f: FavoriteDish, date: DateKey, slot: MealSlot, makeId: () => string): MealRecord[] {
  const { id: _id, ...body } = f;
  void _id;
  return [toRecord(body, date, slot, makeId)];
}

export function recordsFromFavoriteMeal(f: FavoriteMeal, date: DateKey, slot: MealSlot, makeId: () => string): MealRecord[] {
  return f.dishes.map((d) => toRecord(d, date, slot, makeId));
}

/** Filtra per nome (senza maiuscole né accenti); testo vuoto = tutti. */
export function filterByName<T extends { name: string }>(list: readonly T[], query: string): T[] {
  const q = normalizeText(query);
  return q === "" ? [...list] : list.filter((f) => normalizeText(f.name).includes(q));
}

export function mealTotalKcal(f: FavoriteMeal): number {
  return Math.round(f.dishes.reduce((sum, d) => sum + d.kcal, 0));
}

/** Elimina un preferito (piatto o pasto) subito, senza conferma: i preferiti si eliminano scorrendo la riga. */
export async function deleteFavorite(store: DataStore, kind: "dish" | "meal", id: string): Promise<void> {
  if (kind === "dish") await store.deleteFavoriteDish(id);
  else await store.deleteFavoriteMeal(id);
}

/** Il peso scritto nel pannello «Salva nei preferiti» (BRIEF §4.1): vuoto = nessun peso; altrimenti un intero positivo fino a 5.000 g. */
export function parseFavoriteWeight(text: string): { ok: true; weightG: number | null } | { ok: false } {
  const r = parseDecimal(text);
  if (r === "empty") return { ok: true, weightG: null };
  if (r === "invalid" || !Number.isInteger(r) || r <= 0 || r > 5000) return { ok: false };
  return { ok: true, weightG: r };
}

/** Un piatto senza peso, che non è già tra i preferiti: salvandolo si chiede il peso (pannello «Salva nei preferiti»). */
export function needsWeightPrompt(favorites: readonly NameAndQuantity[], dish: NameAndQuantity & { weightG?: number | null }): boolean {
  return (dish.weightG ?? null) === null && !isFavoriteDish(favorites, dish);
}

/** Salva il piatto nei preferiti con il nome e il peso scritti nel pannello; la regola dei doppioni (stesso nome e stessa quantità) è quella di sempre. */
export async function saveFavoriteDishAs(store: DataStore, dish: Pick<MealRecord, keyof DishBody>, name: string, weightG: number | null, makeId: () => string): Promise<void> {
  const existing = await store.listFavoriteDishes();
  const named = { ...dish, name: name.trim() || dish.name, weightG };
  await store.saveFavoriteDish(favoriteForDish(existing, named, makeId).favorite);
}

/** I campi della scheda del piatto con i valori di un preferito (BRIEF §4.1, «Modifica preferito»). La fascia non c'entra: la riga Pasto non c'è. */
export function favoriteToForm(f: FavoriteDish): MealFormValues {
  return mealToForm({ ...f, slot: "pranzo", isFree: false });
}

/** Il preferito aggiornato con i campi controllati della scheda: stesso id, nome, ingredienti, peso e numeri nuovi. I piatti già registrati non cambiano. */
export function favoriteFromForm(id: string, parsed: ParsedMeal): FavoriteDish {
  return { id, name: parsed.name, quantity: parsed.quantity, weightG: parsed.weightG, kcal: parsed.kcal, protein: parsed.protein, carbs: parsed.carbs, fat: parsed.fat, fiber: parsed.fiber, salt: parsed.salt };
}

/** Le tessere che compaiono scorrendo una riga dei preferiti (BRIEF §4.1): «Modifica» solo per i piatti, «Elimina» per tutti. */
export function favoriteRowActions(kind: "dish" | "meal"): ("modifica" | "elimina")[] {
  return kind === "dish" ? ["modifica", "elimina"] : ["elimina"];
}
