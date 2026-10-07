import { bikeBonus, stepsBonus } from "./activity";
import { kcalBudget } from "./budget";
import { weekDates, weekdayIndex } from "./dates";
import type { DateKey, Day, Settings } from "./types";

export interface DayTarget {
  /** Base del giorno dopo il recupero, rispettata la soglia minima (non arrotondata). */
  base: number;
  /** Recupero del saldo negativo, ≤ 0 (non arrotondato). */
  recovery: number;
  bikeBonus: number;
  stepsBonus: number;
  /** Obiettivo del giorno, arrotondato. */
  total: number;
}

type TargetSettings = Pick<
  Settings,
  "baseKcal" | "floorKcal" | "bonusShare" | "kcalPerKm" | "kcalPerStep" | "stepThreshold" | "freeMealCap"
>;

const EMPTY_ACTIVITY = { steps: null, bikeKm: null, bikeKcalHealth: null };

/**
 * Saldo dei giorni della stessa settimana precedenti a `date` che hanno almeno un pasto:
 * somma di baseKcal + bonus bici + bonus passi − kcal di budget.
 */
export function weekBalanceBefore(date: DateKey, weekDays: readonly Day[], settings: TargetSettings): number {
  const inWeek = new Set(weekDates(date));
  return weekDays
    .filter((d) => inWeek.has(d.date) && d.date < date && d.meals.length > 0)
    .reduce(
      (sum, d) =>
        sum + settings.baseKcal + bikeBonus(d.activity, settings) + stepsBonus(d.activity, settings) - kcalBudget(d.meals, settings),
      0,
    );
}

/**
 * Obiettivo del giorno (§3.3). `weekDays` contiene i giorni noti della settimana
 * (lunedì-domenica) che contiene `date`; quelli fuori settimana sono ignorati.
 */
export function dayTarget(date: DateKey, weekDays: readonly Day[], settings: TargetSettings): DayTarget {
  const i = weekdayIndex(date);
  const balance = weekBalanceBefore(date, weekDays, settings);
  const recovery = i === 0 ? 0 : Math.min(0, balance) / (7 - i);
  const base = Math.max(Math.min(settings.floorKcal, settings.baseKcal), settings.baseKcal + recovery);

  const today = weekDays.find((d) => d.date === date);
  const activity = today?.activity ?? EMPTY_ACTIVITY;
  const bike = bikeBonus(activity, settings);
  const steps = stepsBonus(activity, settings);

  return { base, recovery, bikeBonus: bike, stepsBonus: steps, total: Math.round(base + bike + steps) };
}
