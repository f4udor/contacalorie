import type { DataStore } from "./store";
import type { ActivityRecord, MealRecord, StoredData, UserSettings, WeighIn } from "./types";

/** Quanti dati contiene un archivio. */
export interface DataSummary {
  /** Giorni diversi con almeno un piatto, un'attività o una pesata. */
  days: number;
  dishes: number;
  weighIns: number;
}

export function summarize(data: StoredData): DataSummary {
  const dates = new Set<string>();
  for (const list of [data.meals, data.activity, data.weighIns]) for (const r of list) dates.add(r.date);
  return { days: dates.size, dishes: data.meals.length, weighIns: data.weighIns.length };
}

/** Non c'è niente da importare: nessun dato e nessuna impostazione. */
export function isEmptyData(data: StoredData): boolean {
  return data.meals.length === 0 && data.favoriteDishes.length === 0 && data.favoriteMeals.length === 0 && data.activity.length === 0 && data.weighIns.length === 0 && Object.keys(data.settings).length === 0;
}

/**
 * Allinea il segno "libero" dei piatti che stanno nello stesso pasto (data e fascia): con la regola dei pasti composti
 * un pasto è libero per intero. I dati salvati prima dei pasti composti avevano un piatto per voce e il segno solo su
 * alcune: se in un pasto almeno un piatto è libero, il segno vale per tutti. Restituisce i piatti e quanti pasti sono cambiati.
 */
export function normalizeFreeFlags(meals: readonly MealRecord[]): { meals: MealRecord[]; changedMeals: number } {
  const free = new Set(meals.filter((m) => m.isFree).map((m) => `${m.date}|${m.slot}`));
  const changed = new Set<string>();
  const out = meals.map((m) => {
    const key = `${m.date}|${m.slot}`;
    if (free.has(key) && !m.isFree) {
      changed.add(key);
      return { ...m, isFree: true };
    }
    return m;
  });
  return { meals: out, changedMeals: changed.size };
}

export interface ImportResult {
  /** Piatti nuovi nell'account. */
  addedDishes: number;
  addedWeighIns: number;
  /** Giorni con attività nuovi. */
  addedActivityDays: number;
  /** Piatti e pasti preferiti nuovi. */
  addedFavorites: number;
  /** Elementi che c'erano già nell'account e non sono stati toccati o duplicati. */
  alreadyThere: number;
  /** Pasti in cui il segno "libero" è stato esteso a tutti i piatti. */
  normalizedFreeMeals: number;
}

const hasAny = (...v: unknown[]) => v.some((x) => x !== null && x !== undefined);

/** Unione di due attività dello stesso giorno: per ogni gruppo di valori vince quello già nell'account, se c'è. */
export function mergeActivity(remote: ActivityRecord, local: ActivityRecord): ActivityRecord {
  const useRemoteSteps = hasAny(remote.steps);
  const useRemoteBike = hasAny(remote.bikeKm, remote.bikeKcalHealth);
  return {
    date: remote.date,
    steps: useRemoteSteps ? remote.steps : local.steps,
    stepsSource: useRemoteSteps ? remote.stepsSource : local.stepsSource,
    bikeKm: useRemoteBike ? remote.bikeKm : local.bikeKm,
    bikeKcalHealth: useRemoteBike ? remote.bikeKcalHealth : local.bikeKcalHealth,
    bikeSource: useRemoteBike ? remote.bikeSource : local.bikeSource,
  };
}

async function inChunks<T>(items: readonly T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

/**
 * Porta nell'account i dati salvati sul dispositivo, senza doppioni: si può ripetere, anche da un altro dispositivo con
 * dati diversi, e le due raccolte si uniscono.
 * - piatti: stesso id = stesso piatto (già presente: non si tocca);
 * - attività, pesate: se c'è già qualcosa per quel giorno vince quello dell'account, altrimenti si aggiunge;
 * - impostazioni: i valori già nell'account restano, quelli mancanti si completano.
 * Non cancella nulla, né nell'account né sul dispositivo.
 */
export async function importLocalData(local: StoredData, remote: DataStore): Promise<ImportResult> {
  const existing = await remote.exportAll();
  const result: ImportResult = { addedDishes: 0, addedWeighIns: 0, addedActivityDays: 0, addedFavorites: 0, alreadyThere: 0, normalizedFreeMeals: 0 };

  // piatti
  const normalized = normalizeFreeFlags(local.meals);
  result.normalizedFreeMeals = normalized.changedMeals;
  const knownMeals = new Set(existing.meals.map((m) => m.id));
  const newMeals = normalized.meals.filter((m) => !knownMeals.has(m.id));
  result.alreadyThere += normalized.meals.length - newMeals.length;
  result.addedDishes = newMeals.length;
  await inChunks(newMeals, 5, (m) => remote.saveMeal(m));

  // attività
  const remoteActivity = new Map(existing.activity.map((a) => [a.date, a]));
  const activityToWrite: ActivityRecord[] = [];
  for (const a of local.activity) {
    const r = remoteActivity.get(a.date);
    if (!r) {
      activityToWrite.push(a);
      result.addedActivityDays++;
      continue;
    }
    const merged = mergeActivity(r, a);
    if (JSON.stringify(merged) !== JSON.stringify(r)) {
      activityToWrite.push(merged);
      result.addedActivityDays++;
    } else {
      result.alreadyThere++;
    }
  }
  await inChunks(activityToWrite, 5, (a) => remote.saveActivity(a));

  // pesate
  const knownWeights = new Set(existing.weighIns.map((w) => w.date));
  const newWeights: WeighIn[] = local.weighIns.filter((w) => !knownWeights.has(w.date));
  result.alreadyThere += local.weighIns.length - newWeights.length;
  result.addedWeighIns = newWeights.length;
  await inChunks(newWeights, 5, (w) => remote.saveWeighIn(w));

  // preferiti: stesso id = stesso preferito
  const knownFavDishes = new Set(existing.favoriteDishes.map((f) => f.id));
  const newFavDishes = local.favoriteDishes.filter((f) => !knownFavDishes.has(f.id));
  const knownFavMeals = new Set(existing.favoriteMeals.map((f) => f.id));
  const newFavMeals = local.favoriteMeals.filter((f) => !knownFavMeals.has(f.id));
  result.alreadyThere += local.favoriteDishes.length - newFavDishes.length + local.favoriteMeals.length - newFavMeals.length;
  result.addedFavorites = newFavDishes.length + newFavMeals.length;
  await inChunks(newFavDishes, 5, (f) => remote.saveFavoriteDish(f));
  await inChunks(newFavMeals, 5, (f) => remote.saveFavoriteMeal(f));

  // impostazioni: completa solo quelle mancanti
  const missing: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(local.settings)) if (v !== undefined && (existing.settings as Record<string, unknown>)[k] === undefined) missing[k] = v;
  if (Object.keys(missing).length > 0) await remote.saveSettings(missing as UserSettings);

  return result;
}
