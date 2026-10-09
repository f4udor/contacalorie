import { groupMeals } from "@/engine";
import type { DateKey, MealSlot } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord, WeighIn } from "@/data";
import { hasManualBike, withManualBike, withoutManualBike } from "./activity-form";
import type { ParsedBike } from "./activity-form";
import { setMealFree } from "./save-dish";

export type ActivityKind = "bici" | "passi";

/** Pesate comprese tra due date, dalla più recente. */
export function weighInsInWeek(weighIns: readonly WeighIn[], monday: DateKey, sunday: DateKey): WeighIn[] {
  return weighIns.filter((w) => w.date >= monday && w.date <= sunday).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface ActivityRow {
  date: DateKey;
  /** Passi del giorno (sempre da Salute; un vecchio valore a mano si può solo eliminare). */
  steps: number | null;
  /** Bici, parte di Salute: km e kcal registrate. */
  km: number | null;
  kcal: number | null;
  /** Fonte dei passi o della parte di Salute della bici. */
  source: "salute" | "manuale" | null;
  /** Bici, parte inserita a mano. */
  kmManual: number | null;
  kcalManual: number | null;
  /** Si può eliminare: i vecchi passi a mano e la parte a mano della bici. Mai un valore da Salute. */
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
      return { date, steps, km: null, kcal: null, source, kmManual: null, kcalManual: null, canDelete: steps !== null && canDeleteSource(source) };
    }
    const km = a?.bikeKm ?? null;
    const kcal = a?.bikeKcalHealth ?? null;
    const source = km === null && kcal === null ? null : (a?.bikeSource ?? "salute");
    return { date, steps: null, km, kcal, source, kmManual: a?.bikeKmManual ?? null, kcalManual: a?.bikeKcalManual ?? null, canDelete: hasManualBike(a) };
  });
}

/** Il record senza il valore a mano indicato (vecchi passi a mano o parte a mano della bici); null se non c'è nulla da eliminare. */
export function withoutActivityValue(record: ActivityRecord, kind: ActivityKind): ActivityRecord | null {
  if (kind === "passi") {
    if (record.steps === null || !canDeleteSource(record.stepsSource)) return null;
    return { ...record, steps: null, stepsSource: null };
  }
  return withoutManualBike(record);
}

/** Elimina un vecchio valore di passi a mano o la parte a mano della bici. Con un valore da Salute non fa nulla e restituisce falso. */
export async function deleteActivityValue(store: DataStore, date: DateKey, kind: ActivityKind): Promise<boolean> {
  const record = await store.getActivity(date);
  if (!record) return false;
  const next = withoutActivityValue(record, kind);
  if (!next) return false;
  await store.saveActivity(next);
  return true;
}

/** Salva la parte a mano della bici di un giorno (nuova o modificata). Non tocca i passi né la parte di Salute. */
export async function saveManualBike(store: DataStore, date: DateKey, bike: ParsedBike): Promise<void> {
  await store.saveActivity(withManualBike(date, bike, await store.getActivity(date)));
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

const SLOT_NAME: Record<MealSlot, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena", spuntino: "Spuntino" };

/** Il pasto come si legge nell'elenco del pannello Pasto libero: «Cena di martedì», con sotto «Pizza margherita, birra · 1.310 kcal». */
export function weekMealTitle(m: Pick<WeekMeal, "date" | "slot">, weekdayLower: (date: DateKey) => string): string {
  return `${SLOT_NAME[m.slot]} di ${weekdayLower(m.date)}`;
}

/** Il giorno proposto per una nuova uscita in bici o un nuovo pasto in una settimana: oggi se è nella settimana, altrimenti l'ultimo giorno della settimana già passato. */
export const defaultDayInWeek = defaultWeighInDate;
