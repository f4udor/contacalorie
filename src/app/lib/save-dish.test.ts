import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "@/data";
import type { MealRecord } from "@/data";
import { isMealFree, saveDish, setMealFree } from "./save-dish";

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

describe("isMealFree", () => {
  const dishes = [dish("a", "pranzo", 500, true), dish("b", "pranzo", 300, true), dish("c", "cena", 400)];
  it("un pasto è libero se almeno un piatto lo è", () => {
    expect(isMealFree(dishes, "pranzo")).toBe(true);
    expect(isMealFree(dishes, "cena")).toBe(false);
    expect(isMealFree(dishes, "colazione")).toBe(false);
  });
  it("escludendo un piatto, conta solo gli altri", () => {
    expect(isMealFree(dishes, "pranzo", "a")).toBe(true);
    expect(isMealFree([dish("a", "pranzo", 500, true)], "pranzo", "a")).toBe(false);
  });
});

describe("aggiunta di un piatto normale a un pasto già libero (dal + generale)", () => {
  it("il piatto prende il segno del pasto e il pasto resta libero", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(dish("a", "cena", 900, true));
    // il modulo parte dallo stato del pasto scelto: libero
    const mealFree = isMealFree(await s.listMeals("2026-01-08"), "cena");
    await saveDish(s, dish("b", "cena", 200), mealFree);
    expect(await free(s)).toEqual({ a: true, b: true });
  });
});
