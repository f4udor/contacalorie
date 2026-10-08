import { groupMeals } from "./meals";
import type { Day, Meal, MealGroup, MealKey, Settings } from "./types";

/** Kcal di un pasto contate nel budget: se è libero, la somma dei suoi piatti conta al massimo `freeMealCap`. */
export function mealBudgetKcal(group: Pick<MealGroup, "kcal" | "isFree">, settings: Pick<Settings, "freeMealCap">): number {
  return group.isFree ? Math.min(group.kcal, settings.freeMealCap) : group.kcal;
}

/** Kcal contate nel budget per i piatti di un giorno (giorno senza piatti: 0). */
export function kcalBudget(dishes: readonly Meal[], settings: Pick<Settings, "freeMealCap">): number {
  return groupMeals(dishes).reduce((sum, g) => sum + mealBudgetKcal(g, settings), 0);
}

/** Kcal reali mangiate in un giorno, senza tetto del pasto libero (giorno senza piatti: 0). */
export function kcalEaten(dishes: readonly Meal[]): number {
  return dishes.reduce((sum, m) => sum + m.kcal, 0);
}

/**
 * Dice se nei giorni della settimana c'è già un pasto libero.
 * `excludeMeal` esclude un pasto (giorno e fascia): serve quando lo si sta modificando.
 */
export function hasFreeMealInWeek(days: readonly Day[], excludeMeal?: MealKey): boolean {
  return days.some((d) =>
    d.meals.some((m) => m.isFree && !(excludeMeal !== undefined && d.date === excludeMeal.date && m.slot === excludeMeal.slot)),
  );
}
