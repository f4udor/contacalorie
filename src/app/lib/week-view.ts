import { lightKcalRing, weekSummary } from "@/engine";
import type { DateKey, Day, RingColor, Settings, WeekSummary } from "@/engine";

export interface WeekBar {
  date: DateKey;
  hasMeals: boolean;
  /** Kcal reali mangiate. */
  eaten: number;
  target: number;
  /** Colore secondo l'anello kcal (budget contro obiettivo). */
  color: RingColor;
  /** Altezza della barra, da 0 a 1 rispetto alla scala della settimana. */
  barRatio: number;
  /** Posizione della linea dell'obiettivo, da 0 a 1. */
  targetRatio: number;
}

export interface WeekView {
  summary: WeekSummary;
  bars: WeekBar[];
  /** Nessun pasto, o attività in tutta la settimana. */
  isEmpty: boolean;
}

/** Barre e riepilogo della settimana che contiene `date`, calcolati dal motore. */
export function buildWeekView(input: { date: DateKey; days: readonly Day[]; settings: Settings; /** Oggi: i giorni dopo oggi usano l'anteprima dell'obiettivo. */ today?: DateKey }): WeekView {
  const summary = weekSummary(input.date, input.days, input.settings, input.today);
  const top = Math.max(1, ...summary.days.map((d) => Math.max(d.kcalEaten, d.target))) * 1.08;
  const bars: WeekBar[] = summary.days.map((d) => ({
    date: d.date,
    hasMeals: d.hasMeals,
    eaten: d.kcalEaten,
    target: d.target,
    color: d.hasMeals ? lightKcalRing(d.kcalBudget, d.target) : "neutro",
    barRatio: d.kcalEaten / top,
    targetRatio: d.target / top,
  }));
  const isEmpty =
    summary.balance === null && summary.totalKm === null && summary.avgSteps === null;
  return { summary, bars, isEmpty };
}
