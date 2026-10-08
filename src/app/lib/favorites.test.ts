import { describe, expect, it } from "vitest";
import type { FavoriteDish, FavoriteMeal, MealRecord } from "@/data";
import { defaultMealName, favoriteForDish, favoriteForMeal, filterByName, mealTotalKcal, normalizeText, recordsFromFavoriteDish, recordsFromFavoriteMeal, sameDish } from "./favorites";

const dish = (name: string, quantity: string | null = null, kcal = 100): MealRecord => ({ id: `d-${name}`, date: "2026-01-07", slot: "cena", name, quantity, kcal, protein: 10, carbs: 20, fat: 5, fiber: 2, salt: 0.5, isFree: true, originalText: "testo" });
const ids = () => {
  let n = 0;
  return () => `id${++n}`;
};

describe("normalizeText / filterByName", () => {
  it("senza maiuscole né accenti", () => {
    expect(normalizeText("  Caffè  ")).toBe("caffe");
    expect(filterByName([{ name: "Caffè lungo" }, { name: "Pasta" }], "CAFFE")).toEqual([{ name: "Caffè lungo" }]);
    expect(filterByName([{ name: "A" }, { name: "B" }], "  ")).toHaveLength(2);
    expect(filterByName([{ name: "A" }], "zzz")).toEqual([]);
  });
});

describe("defaultMealName", () => {
  it("nomi dei piatti, accorciati; senza nomi 'Pasto'", () => {
    expect(defaultMealName([dish("Totano"), dish("Insalata")])).toBe("Totano, Insalata");
    const long = defaultMealName([dish("A".repeat(30)), dish("B".repeat(30))]);
    expect(long.length).toBe(40);
    expect(long.endsWith("…")).toBe(true);
    expect(defaultMealName([dish(" ")])).toBe("Pasto");
  });
});

describe("favoriteForDish", () => {
  it("nuovo: id nuovo, senza data, fascia né segno libero", () => {
    const { favorite, updated } = favoriteForDish([], dish("Pasta", "80 g"), ids());
    expect(updated).toBe(false);
    expect(favorite).toEqual({ id: "id1", name: "Pasta", quantity: "80 g", kcal: 100, protein: 10, carbs: 20, fat: 5, fiber: 2, salt: 0.5 });
  });
  it("stesso nome e quantità (senza maiuscole): aggiorna il preferito esistente", () => {
    const existing: FavoriteDish[] = [{ id: "f9", name: "pasta", quantity: "80 G", kcal: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }];
    const r = favoriteForDish(existing, dish("Pasta", "80 g", 450), ids());
    expect(r.updated).toBe(true);
    expect(r.favorite).toMatchObject({ id: "f9", kcal: 450 });
    expect(sameDish({ name: "Pasta", quantity: "80 g" }, { name: "Pasta", quantity: "100 g" })).toBe(false);
    expect(sameDish({ name: "Pasta", quantity: null }, { name: "Pasta", quantity: "" })).toBe(true);
  });
});

describe("favoriteForMeal", () => {
  it("salva tutti i piatti con il nome scelto (o proposto) e la fascia", () => {
    const { favorite } = favoriteForMeal([], "  Cena leggera ", "cena", [dish("Totano"), dish("Insalata", "1 ciotola", 60)], ids());
    expect(favorite).toMatchObject({ id: "id1", name: "Cena leggera", slot: "cena" });
    expect(favorite.dishes.map((d) => d.name)).toEqual(["Totano", "Insalata"]);
    expect(favorite.dishes[0]).not.toHaveProperty("isFree");
    expect(favoriteForMeal([], " ", "cena", [dish("Totano")], ids()).favorite.name).toBe("Totano");
  });
  it("stesso nome: sostituisce", () => {
    const existing: FavoriteMeal[] = [{ id: "p7", name: "cena leggera", slot: "cena", dishes: [] }];
    const r = favoriteForMeal(existing, "Cena Leggera", "cena", [dish("X")], ids());
    expect(r.updated).toBe(true);
    expect(r.favorite.id).toBe("p7");
  });
});

describe("aggiungere un preferito al giorno", () => {
  const body = { name: "Pasta", quantity: "80 g", kcal: 480, protein: 15, carbs: 70, fat: 16, fiber: 4, salt: 1.3 };
  it("piatto: un piatto normale nella fascia scelta, senza testo originale", () => {
    expect(recordsFromFavoriteDish({ id: "f1", ...body }, "2026-01-08", "pranzo", ids())).toEqual([{ id: "id1", date: "2026-01-08", slot: "pranzo", ...body, isFree: false, originalText: null }]);
  });
  it("pasto: tutti i piatti, id diversi, nella fascia scelta", () => {
    const meal: FavoriteMeal = { id: "p1", name: "Cena", slot: "cena", dishes: [body, { ...body, name: "Insalata", quantity: null, kcal: 60 }] };
    const records = recordsFromFavoriteMeal(meal, "2026-01-08", "spuntino", ids());
    expect(records.map((r) => [r.id, r.slot, r.name, r.isFree])).toEqual([["id1", "spuntino", "Pasta", false], ["id2", "spuntino", "Insalata", false]]);
    expect(mealTotalKcal(meal)).toBe(540);
  });
});
