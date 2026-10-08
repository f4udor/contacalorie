import { groupMeals } from "@/engine";
import type { DateKey, MealSlot } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord, WeighIn } from "@/data";
import { setMealFree } from "./save-dish";

export type ActivityKind = "bici" | "passi";

/** Pesate comprese tra due date, dalla più recente. */
export function weighInsInWeek(weighIns: readonly WeighIn[], monday: DateKey, sunday: DateKey): WeighIn[] {
  return weighIns.filter((w) => w.date >= monday && w.date <= sunday).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface ActivityRow {
  date: DateKey;
  /** Passi, km o kcal inserite a mano; null se il giorno è vuoto. */
  steps: number | null;
  km: number | null;
  kcal: number | null;
  source: "salute" | "manuale" | null;
  /** Solo i valori inseriti a mano si eliminano; quelli da Salute no. */
  canDelete: boolean;
}

/** Un valore si può eliminare solo se è stato inserito a mano. */
export const canDeleteSource = (source: "salute" | "manuale" | null): boolean => source === "manuale";

/** I giorni indicati, con il valore di passi o bici e la fonte. */
export function activityRows(kind: ActivityKind, activity: readonly ActivityRecord[], dates: readonly DateKey[]): ActivityRow[] {
  return dates.map((date) => {
    const a = activity.find((x) => x.date === date);
    if (kind === "passi") {
      const steps = a?.steps ?? null;
      const source = steps === null ? null : (a?.stepsSource ?? null);
      return { date, steps, km: null, kcal: null, source, canDelete: steps !== null && canDeleteSource(source) };
    }
    const km = a?.bikeKm ?? null;
    const kcal = a?.bikeKcalHealth ?? null;
    const source = km === null && kcal === null ? null : (a?.bikeSource ?? null);
    return { date, steps: null, km, kcal, source, canDelete: (km !== null || kcal !== null) && canDeleteSource(source) };
  });
}

/** Il record senza il valore di passi o bici indicato (il giorno resta vuoto per quel valore); null se il valore non si può eliminare. */
export function withoutActivityValue(record: ActivityRecord, kind: ActivityKind): ActivityRecord | null {
  if (kind === "passi") {
    if (record.steps === null || !canDeleteSource(record.stepsSource)) return null;
    return { ...record, steps: null, stepsSource: null };
  }
  if ((record.bikeKm === null && record.bikeKcalHealth === null) || !canDeleteSource(record.bikeSource)) return null;
  return { ...record, bikeKm: null, bikeKcalHealth: null, bikeSource: null };
}

/** Elimina un valore di passi o bici inserito a mano. Con un valore da Salute non fa nulla e restituisce falso. */
export async function deleteActivityValue(store: DataStore, date: DateKey, kind: ActivityKind): Promise<boolean> {
  const record = await store.getActivity(date);
  if (!record) return false;
  const next = withoutActivityValue(record, kind);
  if (!next) return false;
  await store.saveActivity(next);
  return true;
}

export interface WeekMeal {
  date: DateKey;
  slot: MealSlot;
  kcal: number;
  isFree: boolean;
  /** Nomi dei piatti, per riconoscere il pasto. */
  names: string[];
}

/** I pasti della settimana (data e fascia), in ordine cronologico. */
export function weekMeals(meals: readonly MealRecord[]): WeekMeal[] {
  const dates = [...new Set(meals.map((m) => m.date))].sort();
  return dates.flatMap((date) =>
    groupMeals(meals.filter((m) => m.date === date)).map((g) => ({ date, slot: g.slot, kcal: g.kcal, isFree: g.isFree, names: g.dishes.map((d) => d.name) })),
  );
}

/** Il pasto libero della settimana, se c'è. */
export function freeMealOfWeek(meals: readonly MealRecord[]): WeekMeal | null {
  return weekMeals(meals).find((m) => m.isFree) ?? null;
}

/** Toglie il pasto libero: il pasto resta e torna normale (conta per intero). */
export async function removeFreeMeal(store: DataStore, meal: Pick<WeekMeal, "date" | "slot">): Promise<void> {
  await setMealFree(store, meal.date, meal.slot, false);
}

/** Segna come libero un pasto, ma solo se la settimana non ne ha già uno. Restituisce falso se non l'ha fatto. */
export async function markFreeMeal(store: DataStore, weekMealsList: readonly WeekMeal[], meal: Pick<WeekMeal, "date" | "slot">): Promise<boolean> {
  if (weekMealsList.some((m) => m.isFree)) return false;
  await setMealFree(store, meal.date, meal.slot, true);
  return true;
}

/** Il giorno proposto per una nuova pesata: oggi se è nella settimana, altrimenti l'ultimo giorno della settimana già passato (o il lunedì). */
export function defaultWeighInDate(dates: readonly DateKey[], today: DateKey): DateKey {
  if (dates.includes(today)) return today;
  const past = dates.filter((d) => d <= today);
  return past.length > 0 ? past[past.length - 1] : dates[0];
}
