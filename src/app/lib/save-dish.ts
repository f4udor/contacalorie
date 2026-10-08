import type { DateKey, Meal, MealSlot } from "@/engine";
import type { DataStore, MealRecord } from "@/data";

/**
 * Salva un piatto e allinea il segno "libero" sull'intero pasto (stessa data e fascia):
 * il segno sta su tutti i piatti del pasto, quindi `mealIsFree` vale per tutti.
 * Se il piatto cambia fascia, il pasto che lascia non viene toccato.
 */
export async function saveDish(store: DataStore, dish: MealRecord, mealIsFree: boolean): Promise<void> {
  const saved: MealRecord = { ...dish, isFree: mealIsFree };
  await store.saveMeal(saved);
  await setMealFree(store, saved.date, saved.slot, mealIsFree);
}

/** Imposta il segno "libero" su tutti i piatti del pasto (data e fascia). */
export async function setMealFree(store: DataStore, date: DateKey, slot: MealSlot, isFree: boolean): Promise<void> {
  const dishes = await store.listMeals(date);
  for (const d of dishes) {
    if (d.slot === slot && d.isFree !== isFree) await store.saveMeal({ ...d, isFree });
  }
}

/**
 * Dice se il pasto di una fascia è libero, guardando i piatti del giorno (un pasto è libero se almeno un piatto lo è).
 * `excludeDishId` lascia fuori un piatto (quello che si sta modificando).
 */
export function isMealFree(dishes: readonly Pick<Meal, "id" | "slot" | "isFree">[], slot: MealSlot, excludeDishId?: string): boolean {
  return dishes.some((d) => d.slot === slot && d.isFree && d.id !== excludeDishId);
}
