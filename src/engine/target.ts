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

export type TargetSettings = Pick<
  Settings,
  "baseKcal" | "floorKcal" | "bonusShare" | "kcalPerKm" | "kcalPerStep" | "stepThreshold" | "freeMealCap" | "recoveryMaxPerDay" | "recoveryMin" | "creditCap"
>;

const EMPTY_ACTIVITY = { steps: null, bikeKm: null, bikeKcalHealth: null };

/** Un passo del saldo: aggiunge base + bonus − kcal contate e limita il margine positivo a `creditCap`. */
export function stepBalance(balance: number, day: Day, settings: TargetSettings): number {
  const delta = settings.baseKcal + bikeBonus(day.activity, settings) + stepsBonus(day.activity, settings) - kcalBudget(day.meals, settings);
  return Math.min(balance + delta, settings.creditCap);
}

/** Saldo dopo aver scorso, in ordine di data, i giorni con pasti presi da `days` (il tetto vale dopo ogni giorno). */
export function runBalance(days: readonly Day[], settings: TargetSettings): number {
  return [...days]
    .filter((d) => d.meals.length > 0)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .reduce((balance, d) => stepBalance(balance, d, settings), 0);
}

/**
 * Saldo dei giorni della stessa settimana precedenti a `date` che hanno almeno un pasto (§3.3):
 * si parte da 0 e dopo ogni giorno il saldo si limita a `creditCap`.
 */
export function weekBalanceBefore(date: DateKey, weekDays: readonly Day[], settings: TargetSettings): number {
  const inWeek = new Set(weekDates(date));
  return runBalance(
    weekDays.filter((d) => inWeek.has(d.date) && d.date < date),
    settings,
  );
}

/** Recupero del giorno (≤ 0) dato il saldo: nessuno se il debito è sotto `recoveryMin`, altrimenti al massimo `recoveryMaxPerDay`. */
export function recoveryFor(balance: number, settings: TargetSettings): number {
  const debt = Math.max(0, -balance);
  return debt < settings.recoveryMin ? 0 : -Math.min(debt, settings.recoveryMaxPerDay);
}

/** Obiettivo di un giorno noto il saldo dei giorni precedenti della settimana. */
export function targetFromBalance(date: DateKey, balance: number, today: Day | undefined, settings: TargetSettings): DayTarget {
  const recovery = weekdayIndex(date) === 0 ? 0 : recoveryFor(balance, settings);
  const base = Math.max(Math.min(settings.floorKcal, settings.baseKcal), settings.baseKcal + recovery);
  const activity = today?.activity ?? EMPTY_ACTIVITY;
  const bike = bikeBonus(activity, settings);
  const steps = stepsBonus(activity, settings);
  return { base, recovery, bikeBonus: bike, stepsBonus: steps, total: Math.round(base + bike + steps) };
}

/**
 * Obiettivo del giorno (§3.3). `weekDays` contiene i giorni noti della settimana
 * (lunedì-domenica) che contiene `date`; quelli fuori settimana sono ignorati.
 */
export function dayTarget(date: DateKey, weekDays: readonly Day[], settings: TargetSettings): DayTarget {
  return targetFromBalance(date, weekBalanceBefore(date, weekDays, settings), weekDays.find((d) => d.date === date), settings);
}
