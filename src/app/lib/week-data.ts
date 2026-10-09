import { resolveSettings, weekDates } from "@/engine";
import type { DateKey, Day, Plan, Settings } from "@/engine";
import type { ActivityRecord, DataStore, MealRecord, UserSettings, WeighIn } from "@/data";

/** Tutto ciò che serve alle schermate per mostrare la settimana che contiene una data. */
export interface WeekData {
  /** I sette giorni (lunedì-domenica) nel formato del motore. */
  days: Day[];
  /** I pasti della settimana come salvati (con data e testo originale). */
  meals: MealRecord[];
  /** Le attività della settimana come salvate (con le fonti). */
  activity: ActivityRecord[];
  /** Impostazioni complete: quelle dell'utente sopra i default, con kcal base e soglia minima risolte (a mano o calcolate dal profilo, BRIEF §3.9). */
  settings: Settings;
  /** Il piano calcolato dal profilo; null se il profilo è incompleto. */
  plan: Plan | null;
  /** La kcal base è scritta a mano (personalizzata) e non calcolata. */
  baseIsManual: boolean;
  /** Impostazioni come salvate (solo i valori cambiati, più il profilo). */
  userSettings: UserSettings;
  weighIns: WeighIn[];
}

/** Il peso dell'ultima pesata fino a `date` compresa, se c'è: sostituisce il peso del profilo nel calcolo degli obiettivi. */
export function latestWeighInWeight(weighIns: readonly WeighIn[], date: DateKey): number | undefined {
  const upTo = weighIns.filter((w) => w.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  return upTo.length > 0 ? upTo[upTo.length - 1].weightKg : undefined;
}

/** Legge dallo sportello la settimana che contiene `date`. `today` serve agli obiettivi calcolati (giorni alla data dell'obiettivo): senza, vale `date`. */
export async function loadWeekData(store: DataStore, date: DateKey, today: DateKey = date): Promise<WeekData> {
  const dates = weekDates(date);
  const from = dates[0];
  const to = dates[6];
  const [meals, activity, userSettings, weighIns] = await Promise.all([
    store.listMealsBetween(from, to),
    store.listActivityBetween(from, to),
    store.getSettings(),
    store.listWeighIns(),
  ]);

  const days: Day[] = dates.map((d) => {
    const a = activity.find((x) => x.date === d);
    return {
      date: d,
      meals: meals.filter((m) => m.date === d),
      activity: { steps: a?.steps ?? null, bikeKm: a?.bikeKm ?? null, bikeKcalHealth: a?.bikeKcalHealth ?? null, bikeKmManual: a?.bikeKmManual ?? null, bikeKcalManual: a?.bikeKcalManual ?? null },
    };
  });

  const resolved = resolveSettings(userSettings as Record<string, unknown>, today, latestWeighInWeight(weighIns, today));
  return { days, meals, activity, settings: resolved.settings, plan: resolved.plan, baseIsManual: resolved.baseIsManual, userSettings, weighIns };
}
