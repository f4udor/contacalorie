import { describe, expect, it } from "vitest";
import type { FavoriteDish, FavoriteMeal, MealRecord } from "@/data";
import { createMemoryDataStore } from "@/data";
import { defaultMealName, deleteFavorite, favoriteForDish, favoriteForMeal, filterByName, isFavoriteDish, mealTotalKcal, needsWeightPrompt, parseFavoriteWeight, saveFavoriteDishAs, normalizeText, recordsFromFavoriteDish, recordsFromFavoriteMeal, sameDish, toggleFavoriteDish } from "./favorites";

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
    expect(favorite).toEqual({ id: "id1", name: "Pasta", quantity: "80 g", weightG: null, kcal: 100, protein: 10, carbs: 20, fat: 5, fiber: 2, salt: 0.5 });
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

describe("eliminare un preferito (T5b.5)", () => {
  const fav = (id: string, name: string) => ({ id, name, quantity: null, kcal: 100, protein: 1, carbs: 2, fat: 3, fiber: 0, salt: 0 });
  it("un piatto: sparisce subito, gli altri e i pasti restano", async () => {
    const store = createMemoryDataStore();
    await store.saveFavoriteDish(fav("a", "Mela"));
    await store.saveFavoriteDish(fav("b", "Pera"));
    await store.saveFavoriteMeal({ id: "m1", name: "Cena", slot: "cena", dishes: [] });
    await deleteFavorite(store, "dish", "a");
    expect((await store.listFavoriteDishes()).map((f) => f.id)).toEqual(["b"]);
    expect(await store.listFavoriteMeals()).toHaveLength(1);
  });
  it("un pasto: sparisce subito, i piatti restano", async () => {
    const store = createMemoryDataStore();
    await store.saveFavoriteDish(fav("a", "Mela"));
    await store.saveFavoriteMeal({ id: "m1", name: "Cena", slot: "cena", dishes: [] });
    await store.saveFavoriteMeal({ id: "m2", name: "Pranzo", slot: "pranzo", dishes: [] });
    await deleteFavorite(store, "meal", "m1");
    expect((await store.listFavoriteMeals()).map((f) => f.id)).toEqual(["m2"]);
    expect(await store.listFavoriteDishes()).toHaveLength(1);
  });
  it("un id che non esiste non fa danni", async () => {
    const store = createMemoryDataStore();
    await store.saveFavoriteDish(fav("a", "Mela"));
    await deleteFavorite(store, "dish", "zzz");
    expect(await store.listFavoriteDishes()).toHaveLength(1);
  });
});

describe("un piatto è tra i preferiti (T5c.1)", () => {
  const fav = (id: string, name: string, quantity: string | null): FavoriteDish => ({ id, name, quantity, kcal: 100, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 });

  it("confronto con maiuscole e spazi diversi", () => {
    expect(sameDish({ name: "  Pasta   al  Pomodoro ", quantity: " 80   G " }, { name: "pasta al pomodoro", quantity: "80 g" })).toBe(true);
    expect(isFavoriteDish([fav("a", "PASTA", "80 g")], { name: " pasta ", quantity: "80  g" })).toBe(true);
    expect(isFavoriteDish([fav("a", "Pasta", null)], { name: "pasta", quantity: undefined })).toBe(true);
  });
  it("gli accenti contano: «Caffè» e «Caffe» sono piatti diversi", () => {
    expect(sameDish({ name: "Caffè", quantity: null }, { name: "Caffe", quantity: null })).toBe(false);
  });
  it("quantità diversa = piatto diverso", () => {
    expect(isFavoriteDish([fav("a", "Pasta", "80 g")], { name: "Pasta", quantity: "100 g" })).toBe(false);
    expect(isFavoriteDish([fav("a", "Pasta", "80 g")], { name: "Pasta", quantity: null })).toBe(false);
  });
  it("salva, rimuovi, salva di nuovo: mai due righe", async () => {
    const store = createMemoryDataStore();
    const next = ids();
    expect(await toggleFavoriteDish(store, dish("Pasta", "80 g"), next)).toBe("salvato");
    expect(await store.listFavoriteDishes()).toHaveLength(1);
    expect(await toggleFavoriteDish(store, dish("PASTA", " 80  g "), next)).toBe("rimosso");
    expect(await store.listFavoriteDishes()).toHaveLength(0);
    expect(await toggleFavoriteDish(store, dish("Pasta", "80 g"), next)).toBe("salvato");
    expect(await store.listFavoriteDishes()).toHaveLength(1);
  });
  it("salvare un piatto già presente aggiorna la riga e non ne crea una seconda", () => {
    const existing = [fav("f1", "pasta", "80 g")];
    const r = favoriteForDish(existing, dish("  Pasta ", "80 G", 450), ids());
    expect(r.updated).toBe(true);
    expect(r.favorite.id).toBe("f1");
  });
  it("rimuovere toglie anche i doppioni già presenti (l'etichetta passa a «Salva»); gli altri piatti restano", async () => {
    const store = createMemoryDataStore();
    await store.saveFavoriteDish(fav("a", "Pasta", "80 g"));
    await store.saveFavoriteDish(fav("b", "pasta", "80 G"));
    await store.saveFavoriteDish(fav("c", "Pasta", "100 g"));
    expect(await toggleFavoriteDish(store, dish("Pasta", "80 g"), ids())).toBe("rimosso");
    expect((await store.listFavoriteDishes()).map((f) => f.id)).toEqual(["c"]);
  });
  it("pasto con lo stesso nome (maiuscole e spazi diversi): aggiornato, non duplicato", () => {
    const existing: FavoriteMeal[] = [{ id: "p7", name: "Cena  leggera", slot: "cena", dishes: [] }];
    const r = favoriteForMeal(existing, " cena LEGGERA ", "cena", [dish("X")], ids());
    expect(r.updated).toBe(true);
    expect(r.favorite.id).toBe("p7");
  });
});

describe("il peso nei preferiti (T7.0)", () => {
  it("salvando un piatto si salva anche il peso", () => {
    const { favorite } = favoriteForDish([], { ...dish("Hummus", "150 g"), weightG: 150 }, ids());
    expect(favorite.weightG).toBe(150);
  });
  it("un preferito senza peso, salvato di nuovo con il peso (stesso nome e quantità), è aggiornato e non duplicato", () => {
    const existing: FavoriteDish[] = [{ id: "f9", name: "Hummus", quantity: "150 g", weightG: null, kcal: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }];
    const r = favoriteForDish(existing, { ...dish("Hummus", "150 g"), weightG: 150 }, ids());
    expect(r.updated).toBe(true);
    expect(r.favorite).toMatchObject({ id: "f9", weightG: 150 });
  });
  it("un preferito già pesato prende il nuovo peso", () => {
    const existing: FavoriteDish[] = [{ id: "f9", name: "Hummus", quantity: "150 g", weightG: 120, kcal: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }];
    expect(favoriteForDish(existing, { ...dish("Hummus", "150 g"), weightG: 180 }, ids()).favorite.weightG).toBe(180);
  });
  it("salvando un pasto si salva il peso di ogni piatto", () => {
    const { favorite } = favoriteForMeal([], "Cena", "cena", [{ ...dish("Totano"), weightG: 150 }, dish("Insalata")], ids());
    expect(favorite.dishes.map((d) => d.weightG)).toEqual([150, null]);
  });
  it("aggiungendo un preferito al giorno il piatto porta con sé il peso", () => {
    const f: FavoriteDish = { id: "f1", name: "Hummus", quantity: "150 g", weightG: 150, kcal: 150, protein: 7.5, carbs: 10, fat: 9, fiber: 4, salt: 0.5 };
    expect(recordsFromFavoriteDish(f, "2026-01-07", "cena", ids())[0].weightG).toBe(150);
    const m: FavoriteMeal = { id: "p1", name: "Cena", slot: "cena", dishes: [f] };
    expect(recordsFromFavoriteMeal(m, "2026-01-07", "cena", ids())[0].weightG).toBe(150);
  });
});

describe("salvataggio nei preferiti con il peso (T8.1)", () => {
  it("il peso si chiede solo per un piatto senza peso che non è già tra i preferiti", () => {
    expect(needsWeightPrompt([], dish("Torta"))).toBe(true);
    expect(needsWeightPrompt([], { ...dish("Torta"), weightG: 120 })).toBe(false);
    expect(needsWeightPrompt([{ name: "torta", quantity: null }], dish("Torta"))).toBe(false);
  });
  it("peso vuoto = nessun peso; intero positivo fino a 5.000; il resto non vale", () => {
    expect(parseFavoriteWeight("")).toEqual({ ok: true, weightG: null });
    expect(parseFavoriteWeight(" 150 ")).toEqual({ ok: true, weightG: 150 });
    for (const bad of ["12,5", "0", "-3", "abc", "5001"]) expect(parseFavoriteWeight(bad)).toEqual({ ok: false });
  });
  it("«Salva» con il peso: il preferito ha nome e peso scritti; con il campo vuoto si salva senza peso", async () => {
    const store = createMemoryDataStore();
    const id = ids();
    await saveFavoriteDishAs(store, dish("Torta"), " Torta della nonna ", 120, id);
    await saveFavoriteDishAs(store, dish("Pane"), "Pane", null, id);
    const list = await store.listFavoriteDishes();
    expect(list.map((f) => [f.name, f.weightG ?? null])).toEqual([["Torta della nonna", 120], ["Pane", null]]);
  });
  it("lo stesso nome e la stessa quantità sostituiscono il preferito, mai un doppione", async () => {
    const store = createMemoryDataStore();
    await saveFavoriteDishAs(store, dish("Torta"), "Torta", null, ids());
    await saveFavoriteDishAs(store, dish("Torta"), "Torta", 120, ids());
    const list = await store.listFavoriteDishes();
    expect(list).toHaveLength(1);
    expect(list[0].weightG).toBe(120);
  });
});
