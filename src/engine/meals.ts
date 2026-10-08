import { MEAL_SLOTS } from "./types";
import type { Meal, MealGroup } from "./types";

/** Raggruppa i piatti di un giorno nei pasti (uno per fascia), nell'ordine delle fasce. Le fasce senza piatti non compaiono. */
export function groupMeals(dishes: readonly Meal[]): MealGroup[] {
  const groups: MealGroup[] = [];
  for (const slot of MEAL_SLOTS) {
    const inSlot = dishes.filter((d) => d.slot === slot);
    if (inSlot.length === 0) continue;
    groups.push({
      slot,
      dishes: inSlot,
      kcal: inSlot.reduce((a, d) => a + d.kcal, 0),
      protein: inSlot.reduce((a, d) => a + d.protein, 0),
      carbs: inSlot.reduce((a, d) => a + d.carbs, 0),
      fat: inSlot.reduce((a, d) => a + d.fat, 0),
      fiber: inSlot.reduce((a, d) => a + d.fiber, 0),
      salt: inSlot.reduce((a, d) => a + d.salt, 0),
      isFree: inSlot.some((d) => d.isFree),
    });
  }
  return groups;
}
