import { describe, expect, it } from "vitest";
import { groupMeals } from "./meals";
import type { Meal, MealSlot } from "./types";

function dish(id: string, slot: MealSlot, kcal: number, extra: Partial<Meal> = {}): Meal {
  return { id, name: id, slot, kcal, protein: 1, carbs: 2, fat: 3, fiber: 4, salt: 0.5, isFree: false, ...extra };
}

describe("groupMeals", () => {
  it("nessun piatto: nessun pasto", () => {
    expect(groupMeals([])).toEqual([]);
  });

  it("un pasto per fascia, nell'ordine colazione, pranzo, cena, spuntino; le fasce vuote non compaiono", () => {
    const g = groupMeals([dish("s", "spuntino", 100), dish("c", "cena", 300), dish("p", "pranzo", 200)]);
    expect(g.map((x) => x.slot)).toEqual(["pranzo", "cena", "spuntino"]);
  });

  it("somma kcal e nutrienti dei piatti e ne tiene l'elenco", () => {
    const [g] = groupMeals([dish("a", "pranzo", 500), dish("b", "pranzo", 400), dish("c", "pranzo", 300)]);
    expect(g.dishes.map((d) => d.id)).toEqual(["a", "b", "c"]);
    expect(g).toMatchObject({ kcal: 1200, protein: 3, carbs: 6, fat: 9, fiber: 12, salt: 1.5, isFree: false });
  });

  it("libero se almeno un piatto è libero", () => {
    const [g] = groupMeals([dish("a", "cena", 500), dish("b", "cena", 400, { isFree: true })]);
    expect(g.isFree).toBe(true);
  });
});
