import type { Day, Meal, Settings } from "./types";

/** Kcal di un pasto contate nel budget: il pasto libero conta al massimo `freeMealCap`. */
export function mealBudgetKcal(meal: Meal, settings: Pick<Settings, "freeMealCap">): number {
  return meal.isFree ? Math.min(meal.kcal, settings.freeMealCap) : meal.kcal;
}

/** Kcal contate nel budget per i pasti di un giorno (giorno senza pasti: 0). */
export function kcalBudget(meals: readonly Meal[], settings: Pick<Settings, "freeMealCap">): number {
  return meals.reduce((sum, m) => sum + mealBudgetKcal(m, settings), 0);
}

/** Kcal reali mangiate in un giorno, senza tetto del pasto libero (giorno senza pasti: 0). */
export function kcalEaten(meals: readonly Meal[]): number {
  return meals.reduce((sum, m) => sum + m.kcal, 0);
}

/**
 * Dice se nei giorni della settimana c'è già un pasto libero.
 * `excludeMealId` esclude un pasto (serve quando lo si sta modificando).
 */
export function hasFreeMealInWeek(days: readonly Day[], excludeMealId?: string): boolean {
  return days.some((d) => d.meals.some((m) => m.isFree && m.id !== excludeMealId));
}
