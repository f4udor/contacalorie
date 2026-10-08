import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "@/data";
import type { MealRecord } from "@/data";
import { saveDish, setMealFree } from "./save-dish";

function dish(id: string, slot: MealRecord["slot"], kcal: number, isFree = false, date = "2026-01-08"): MealRecord {
  return { id, date, name: id, quantity: null, slot, kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree, originalText: null };
}
const free = async (s: ReturnType<typeof createMemoryDataStore>, date = "2026-01-08") => Object.fromEntries((await s.listMeals(date)).map((d) => [d.id, d.isFree]));

describe("saveDish", () => {
  it("un piatto nuovo in un pasto libero prende il segno libero", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "pranzo", 500, true));
    await saveDish(s, dish("b", "pranzo", 400), true);
    expect(await free(s)).toEqual({ a: true, b: true });
  });

  it("rendere libero un pasto lo fa su tutti i suoi piatti, non sugli altri pasti", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "pranzo", 500));
    await s.saveMeal(dish("b", "pranzo", 400));
    await s.saveMeal(dish("c", "cena", 300));
    await saveDish(s, dish("a", "pranzo", 500), true);
    expect(await free(s)).toEqual({ a: true, b: true, c: false });
  });

  it("togliere il segno libero lo toglie da tutti i piatti del pasto", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "pranzo", 500, true));
    await s.saveMeal(dish("b", "pranzo", 400, true));
    await saveDish(s, dish("b", "pranzo", 400, true), false);
    expect(await free(s)).toEqual({ a: false, b: false });
  });

  it("modifica di un piatto: lo sostituisce senza duplicarlo", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "pranzo", 500));
    await saveDish(s, { ...dish("a", "pranzo", 500), kcal: 700, quantity: "200 g" }, false);
    const list = await s.listMeals("2026-01-08");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ kcal: 700, quantity: "200 g" });
  });

  it("un piatto spostato in un'altra fascia non cambia il pasto che lascia", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "pranzo", 500, true));
    await s.saveMeal(dish("b", "pranzo", 400, true));
    await saveDish(s, dish("b", "cena", 400, true), false);
    expect(await free(s)).toEqual({ a: true, b: false });
  });

  it("non tocca altri giorni", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("x", "pranzo", 500, false, "2026-01-07"));
    await saveDish(s, dish("a", "pranzo", 500), true);
    expect((await free(s, "2026-01-07")).x).toBe(false);
  });
});

describe("setMealFree", () => {
  it("non scrive se è già tutto allineato", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "pranzo", 500, true));
    await setMealFree(s, "2026-01-08", "pranzo", true);
    expect(await free(s)).toEqual({ a: true });
  });
});
