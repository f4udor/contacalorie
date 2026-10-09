import { bikeKmTotal } from "./activity";
import { hasFreeMealInWeek, kcalBudget, kcalEaten } from "./budget";
import { weekDates } from "./dates";
import { previewDayTarget } from "./preview";
import { dayTarget, runBalance } from "./target";
import type { TargetSettings } from "./target";
import type { DateKey, Day } from "./types";

export interface WeekDayRow {
  date: DateKey;
  hasMeals: boolean;
  /** Kcal reali mangiate. */
  kcalEaten: number;
  /** Kcal contate nel budget. */
  kcalBudget: number;
  /** Obiettivo kcal del giorno. */
  target: number;
}

export interface NutrientAverages {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
}

export interface WeekSummary {
  days: WeekDayRow[];
  /** Saldo della regola (§3.3, con il tetto al margine) fino al giorno più recente con pasti, questo compreso; null se nessun giorno ha pasti. */
  balance: number | null;
  /** Media delle kcal reali sui giorni con pasti, escluso oggi (è in corso: abbasserebbe la media); null se nessun giorno è valido (§3.8). */
  avgKcal: number | null;
  avgNutrients: NutrientAverages | null;
  /** Km in bici totali; null se nessun giorno ha km. */
  totalKm: number | null;
  /** Media dei passi sui giorni con passi (> 0); null se nessuno. */
  avgSteps: number | null;
  freeMealUsed: boolean;
}

type WeekSettings = TargetSettings;

const EMPTY_ACTIVITY = { steps: null, bikeKm: null, bikeKcalHealth: null };

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Riepilogo della settimana (lunedì-domenica) che contiene `date`. I giorni mancanti sono considerati vuoti.
 * Se `today` è dato, l'obiettivo dei giorni dopo oggi è l'anteprima di §3.3 (`previewDayTarget`) e la media delle kcal
 * esclude il giorno di oggi (§3.8). Senza `today` nessun giorno è escluso. Il motore non legge la data da solo.
 */
export function weekSummary(date: DateKey, knownDays: readonly Day[], settings: WeekSettings, today?: DateKey): WeekSummary {
  const dates = weekDates(date);
  const days: Day[] = dates.map(
    (d) => knownDays.find((k) => k.date === d) ?? { date: d, meals: [], activity: EMPTY_ACTIVITY },
  );
  const eatenDays = days.filter((d) => d.meals.length > 0);

  const rows: WeekDayRow[] = days.map((d) => ({
    date: d.date,
    hasMeals: d.meals.length > 0,
    kcalEaten: kcalEaten(d.meals),
    kcalBudget: kcalBudget(d.meals, settings),
    target: (today !== undefined && d.date > today ? previewDayTarget(d.date, today, days, settings) : dayTarget(d.date, days, settings)).total,
  }));

  const balance = eatenDays.length === 0 ? null : runBalance(eatenDays, settings);

  const avgOf = (pick: (d: Day) => number): number | null => mean(eatenDays.map(pick));
  const avgNutrients: NutrientAverages | null =
    eatenDays.length === 0
      ? null
      : {
          protein: avgOf((d) => sum(d, "protein")) as number,
          carbs: avgOf((d) => sum(d, "carbs")) as number,
          fat: avgOf((d) => sum(d, "fat")) as number,
          fiber: avgOf((d) => sum(d, "fiber")) as number,
          salt: avgOf((d) => sum(d, "salt")) as number,
        };

  const kmValues = days.map((d) => bikeKmTotal(d.activity)).filter((v): v is number => v !== null);
  const stepValues = days.map((d) => d.activity.steps).filter((v): v is number => v !== null && v > 0);

  return {
    days: rows,
    balance,
    avgKcal: mean(eatenDays.filter((d) => d.date !== today).map((d) => kcalEaten(d.meals))),
    avgNutrients,
    totalKm: kmValues.length === 0 ? null : kmValues.reduce((a, b) => a + b, 0),
    avgSteps: mean(stepValues),
    freeMealUsed: hasFreeMealInWeek(days),
  };
}

function sum(day: Day, key: "protein" | "carbs" | "fat" | "fiber" | "salt"): number {
  return day.meals.reduce((total, m) => total + m[key], 0);
}
