import { mergeSettings, weekDates } from "@/engine";
import type { DateKey, Day, Settings } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord, UserSettings, WeighIn } from "@/data";

/** Tutto ciò che serve alle schermate per mostrare la settimana che contiene una data. */
export interface WeekData {
  /** I sette giorni (lunedì-domenica) nel formato del motore. */
  days: Day[];
  /** I pasti della settimana come salvati (con data e testo originale). */
  meals: MealRecord[];
  /** Le attività della settimana come salvate (con le fonti). */
  activity: ActivityRecord[];
  /** Impostazioni complete: quelle dell'utente sopra i default. */
  settings: Settings;
  /** Impostazioni come salvate (solo i valori cambiati, più il profilo). */
  userSettings: UserSettings;
  weighIns: WeighIn[];
}

/** Legge dallo sportello la settimana che contiene `date`. */
export async function loadWeekData(store: DataStore, date: DateKey): Promise<WeekData> {
  const dates = weekDates(date);
  const from = dates[0];
  const to = dates[6];
  const [meals, activity, userSettings, weighIns, challenge] = await Promise.all([
    store.listMealsBetween(from, to),
    store.listActivityBetween(from, to),
    store.getSettings(),
    store.listWeighIns(),
    store.listChallengeLogBetween(from, to),
  ]);

  const days: Day[] = dates.map((d) => {
    const a = activity.find((x) => x.date === d);
    return {
      date: d,
      meals: meals.filter((m) => m.date === d),
      activity: { steps: a?.steps ?? null, bikeKm: a?.bikeKm ?? null, bikeKcalHealth: a?.bikeKcalHealth ?? null },
      challengeDone: challenge.some((e) => e.date === d && e.status === "fatto"),
    };
  });

  return { days, meals, activity, settings: mergeSettings(userSettings as Record<string, unknown>), userSettings, weighIns };
}
