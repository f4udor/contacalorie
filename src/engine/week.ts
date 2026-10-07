import { bikeBonus, stepsBonus } from "./activity";
import { hasFreeMealInWeek, kcalBudget, kcalEaten } from "./budget";
import { weekDates } from "./dates";
import { dayTarget } from "./target";
import type { DateKey, Day, Settings } from "./types";

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
  /** Saldo dei giorni con pasti (base + bonus − budget); null se nessun giorno ha pasti. */
  balance: number | null;
  /** Media delle kcal reali sui giorni con pasti; null se nessuno. */
  avgKcal: number | null;
  avgNutrients: NutrientAverages | null;
  /** Km in bici totali; null se nessun giorno ha km. */
  totalKm: number | null;
  /** Media dei passi sui giorni con passi (> 0); null se nessuno. */
  avgSteps: number | null;
  freeMealUsed: boolean;
  challengeDaysDone: number;
}

type WeekSettings = Pick<
  Settings,
  "baseKcal" | "floorKcal" | "bonusShare" | "kcalPerKm" | "kcalPerStep" | "stepThreshold" | "freeMealCap"
>;

const EMPTY_ACTIVITY = { steps: null, bikeKm: null, bikeKcalHealth: null };

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

/** Riepilogo della settimana (lunedì-domenica) che contiene `date`. I giorni mancanti sono considerati vuoti. */
export function weekSummary(date: DateKey, knownDays: readonly Day[], settings: WeekSettings): WeekSummary {
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
    target: dayTarget(d.date, days, settings).total,
  }));

  const balance =
    eatenDays.length === 0
      ? null
      : eatenDays.reduce(
          (sum, d) =>
            sum + settings.baseKcal + bikeBonus(d.activity, settings) + stepsBonus(d.activity, settings) - kcalBudget(d.meals, settings),
          0,
        );

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

  const kmValues = days.map((d) => d.activity.bikeKm).filter((v): v is number => v !== null);
  const stepValues = days.map((d) => d.activity.steps).filter((v): v is number => v !== null && v > 0);

  return {
    days: rows,
    balance,
    avgKcal: avgOf((d) => kcalEaten(d.meals)),
    avgNutrients,
    totalKm: kmValues.length === 0 ? null : kmValues.reduce((a, b) => a + b, 0),
    avgSteps: mean(stepValues),
    freeMealUsed: hasFreeMealInWeek(days),
    challengeDaysDone: days.filter((d) => d.challengeDone === true).length,
  };
}

function sum(day: Day, key: "protein" | "carbs" | "fat" | "fiber" | "salt"): number {
  return day.meals.reduce((total, m) => total + m[key], 0);
}
