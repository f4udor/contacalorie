import type { Activity, Settings } from "./types";

type BonusSettings = Pick<Settings, "bonusShare" | "kcalPerKm" | "kcalPerStep" | "stepThreshold">;

/** Kcal della bici: quelle di Salute se presenti, altrimenti km × kcal per km (0 senza bici). */
export function bikeKcal(activity: Pick<Activity, "bikeKm" | "bikeKcalHealth">, settings: Pick<Settings, "kcalPerKm">): number {
  if (activity.bikeKcalHealth !== null) return activity.bikeKcalHealth;
  if (activity.bikeKm !== null) return activity.bikeKm * settings.kcalPerKm;
  return 0;
}

/** Bonus bici: quota delle kcal della bici, arrotondata. */
export function bikeBonus(activity: Pick<Activity, "bikeKm" | "bikeKcalHealth">, settings: BonusSettings): number {
  return Math.round(settings.bonusShare * bikeKcal(activity, settings));
}

/** Bonus passi: quota delle kcal dei passi oltre la soglia, arrotondata. Sotto soglia: 0. */
export function stepsBonus(activity: Pick<Activity, "steps">, settings: BonusSettings): number {
  const over = Math.max(0, (activity.steps ?? 0) - settings.stepThreshold);
  return Math.round(settings.bonusShare * over * settings.kcalPerStep);
}
