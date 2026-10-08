import { addDays } from "@/engine";
import type { DateKey } from "@/engine";
import type { DataStore } from "@/data";
import { newId } from "./ids";

/**
 * Copia i pasti del giorno prima su `date`, sempre come pasti normali (mai liberi).
 * Restituisce quanti ne ha copiati: 0 se ieri non c'erano pasti.
 */
export async function copyMealsFromYesterday(store: DataStore, date: DateKey, makeId: () => string = newId): Promise<number> {
  const yesterday = await store.listMeals(addDays(date, -1));
  for (const m of yesterday) {
    await store.saveMeal({ ...m, id: makeId(), date, isFree: false, originalText: null });
  }
  return yesterday.length;
}
