import type { Activity, Settings } from "./types";

type BonusSettings = Pick<Settings, "bonusShare" | "kcalPerKm" | "kcalPerStep" | "stepThreshold">;

type BikeParts = Pick<Activity, "bikeKm" | "bikeKcalHealth" | "bikeKmManual" | "bikeKcalManual">;

/** Km del giorno: Salute + a mano; null se non c'è nessuna delle due parti. */
export function bikeKmTotal(activity: Pick<Activity, "bikeKm" | "bikeKmManual">): number | null {
  const health = activity.bikeKm ?? null;
  const manual = activity.bikeKmManual ?? null;
  if (health === null && manual === null) return null;
  return (health ?? 0) + (manual ?? 0);
}

/**
 * Kcal della bici: parte di Salute (le kcal registrate se presenti, altrimenti km × kcal per km)
 * più parte a mano (le kcal inserite se presenti, altrimenti km a mano × kcal per km). 0 senza bici.
 */
export function bikeKcal(activity: BikeParts, settings: Pick<Settings, "kcalPerKm">): number {
  const health = activity.bikeKcalHealth ?? (activity.bikeKm ?? 0) * settings.kcalPerKm;
  const manual = activity.bikeKcalManual ?? (activity.bikeKmManual ?? 0) * settings.kcalPerKm;
  return health + manual;
}

/** Bonus bici: quota delle kcal della bici, arrotondata. */
export function bikeBonus(activity: BikeParts, settings: BonusSettings): number {
  return Math.round(settings.bonusShare * bikeKcal(activity, settings));
}

/** Bonus passi: quota delle kcal dei passi oltre la soglia, arrotondata. Sotto soglia: 0. */
export function stepsBonus(activity: Pick<Activity, "steps">, settings: BonusSettings): number {
  const over = Math.max(0, (activity.steps ?? 0) - settings.stepThreshold);
  return Math.round(settings.bonusShare * over * settings.kcalPerStep);
}
