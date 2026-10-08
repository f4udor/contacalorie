import { describe, expect, it } from "vitest";
import { createMemoryDataStore } from "@/data";
import type { MealRecord } from "@/data";
import { copyMealsFromYesterday } from "./copy-meals";

function meal(id: string, date: string, kcal: number, isFree = false): MealRecord {
  return { id, date, name: id, slot: "pranzo", kcal, protein: 1, carbs: 2, fat: 3, fiber: 4, salt: 5, isFree, originalText: "testo" };
}

describe("copyMealsFromYesterday", () => {
  it("copia i pasti di ieri come normali, con id nuovi e senza testo originale", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(meal("a", "2026-01-07", 300));
    await s.saveMeal(meal("b", "2026-01-07", 1100, true));
    let n = 0;
    const copied = await copyMealsFromYesterday(s, "2026-01-08", () => `nuovo${++n}`);
    expect(copied).toBe(2);
    const oggi = await s.listMeals("2026-01-08");
    expect(oggi.map((m) => m.id)).toEqual(["nuovo1", "nuovo2"]);
    expect(oggi.every((m) => !m.isFree && m.originalText === null)).toBe(true);
    expect(oggi.map((m) => m.kcal)).toEqual([300, 1100]);
    expect(oggi[0]).toMatchObject({ name: "a", protein: 1, carbs: 2, fat: 3, fiber: 4, salt: 5 });
  });

  it("lascia intatti i pasti di ieri, anche quello libero", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(meal("b", "2026-01-07", 1100, true));
    await copyMealsFromYesterday(s, "2026-01-08");
    expect((await s.listMeals("2026-01-07"))[0]).toMatchObject({ id: "b", isFree: true });
  });

  it("ieri senza pasti: restituisce 0 e non scrive nulla", async () => {
    const s = createMemoryDataStore();
    expect(await copyMealsFromYesterday(s, "2026-01-08")).toBe(0);
    expect(await s.listMeals("2026-01-08")).toEqual([]);
  });

  it("attraversa il cambio di mese", async () => {
    const s = createMemoryDataStore();
    await s.saveMeal(meal("a", "2025-12-31", 200));
    expect(await copyMealsFromYesterday(s, "2026-01-01")).toBe(1);
    expect(await s.listMeals("2026-01-01")).toHaveLength(1);
  });
});
