import { describe, expect, it } from "vitest";
import { hasFreeMealInWeek, kcalBudget, kcalEaten, mealBudgetKcal } from "./budget";
import { DEFAULT_SETTINGS } from "./defaults";
import { groupMeals } from "./meals";
import type { Day, Meal, MealSlot } from "./types";

function meal(id: string, kcal: number, isFree = false, slot: MealSlot = "pranzo"): Meal {
  return { id, name: id, slot, kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree };
}

/** Il pasto (gruppo) di un solo piatto, per provare `mealBudgetKcal`. */
const group = (dish: Meal) => groupMeals([dish])[0];

function day(date: string, meals: Meal[]): Day {
  return { date, meals, activity: { steps: null, bikeKm: null, bikeKcalHealth: null } };
}

const s = DEFAULT_SETTINGS;

describe("mealBudgetKcal / kcalBudget", () => {
  it("pasto libero sopra il tetto conta il tetto", () => {
    expect(mealBudgetKcal(group(meal("a", 2250, true)), s)).toBe(800);
  });

  it("pasto libero sotto il tetto conta il suo valore", () => {
    expect(mealBudgetKcal(group(meal("a", 600, true)), s)).toBe(600);
  });

  it("pasto libero esattamente al tetto", () => {
    expect(mealBudgetKcal(group(meal("a", 800, true)), s)).toBe(800);
  });

  it("pasto normale conta per intero anche se enorme", () => {
    expect(mealBudgetKcal(group(meal("a", 2250)), s)).toBe(2250);
  });

  it("caso C: mercoledì con pranzo libero da 2.250 kcal → budget 1.800", () => {
    const meals = [meal("col", 400, false, "colazione"), meal("pranzo", 2250, true), meal("cena", 600, false, "cena")];
    expect(kcalBudget(meals, s)).toBe(1800);
  });

  it("rispetta un tetto personalizzato", () => {
    expect(kcalBudget([meal("a", 1000, true)], { freeMealCap: 500 })).toBe(500);
  });

  it("caso L: pranzo libero di tre piatti (500, 400, 300) → mangiate 1.200, nel budget 800", () => {
    const piatti = [meal("a", 500, true), meal("b", 400, true), meal("c", 300, true)];
    expect(kcalEaten(piatti)).toBe(1200);
    expect(kcalBudget(piatti, s)).toBe(800);
  });

  it("il tetto vale per la somma dei piatti, non per il singolo piatto", () => {
    // tre piatti da 300: nessuno supera il tetto, ma la somma (900) sì
    expect(kcalBudget([meal("a", 300, true), meal("b", 300, true), meal("c", 300, true)], s)).toBe(800);
    // somma sotto il tetto: conta il suo valore
    expect(kcalBudget([meal("a", 200, true), meal("b", 300, true)], s)).toBe(500);
  });

  it("un pasto è libero se almeno un suo piatto è libero", () => {
    expect(kcalBudget([meal("a", 500, true), meal("b", 500, false)], s)).toBe(800);
  });

  it("un pasto libero non influisce sugli altri pasti dello stesso giorno", () => {
    const piatti = [meal("a", 700, true, "pranzo"), meal("b", 700, true, "pranzo"), meal("c", 500, false, "cena"), meal("d", 400, false, "cena")];
    expect(kcalBudget(piatti, s)).toBe(800 + 900);
  });

  it("giorno senza pasti: 0", () => {
    expect(kcalBudget([], s)).toBe(0);
    expect(kcalEaten([])).toBe(0);
  });
});

describe("kcalEaten", () => {
  it("restituisce le kcal reali, senza tetto", () => {
    const meals = [meal("col", 400, false, "colazione"), meal("pranzo", 2250, true), meal("cena", 600, false, "cena")];
    expect(kcalEaten(meals)).toBe(3250);
    expect(kcalBudget(meals, s)).toBe(1800);
  });
});

describe("hasFreeMealInWeek", () => {
  const week = [
    day("2026-01-05", [meal("a", 500)]),
    day("2026-01-06", [meal("b", 900, true)]),
    day("2026-01-07", []),
  ];

  it("true se c'è un pasto libero", () => {
    expect(hasFreeMealInWeek(week)).toBe(true);
  });

  it("false se non ce ne sono", () => {
    expect(hasFreeMealInWeek([day("2026-01-05", [meal("a", 500)])])).toBe(false);
    expect(hasFreeMealInWeek([])).toBe(false);
  });

  it("escludendo il pasto libero stesso (giorno e fascia) risulta non usato", () => {
    expect(hasFreeMealInWeek(week, { date: "2026-01-06", slot: "pranzo" })).toBe(false);
  });

  it("escludere un altro pasto non cambia il risultato", () => {
    expect(hasFreeMealInWeek(week, { date: "2026-01-05", slot: "pranzo" })).toBe(true);
    expect(hasFreeMealInWeek(week, { date: "2026-01-06", slot: "cena" })).toBe(true);
  });

  it("con due pasti liberi, escluderne uno lascia l'altro", () => {
    const due = [day("2026-01-05", [meal("x", 500, true)]), day("2026-01-06", [meal("y", 500, true)])];
    expect(hasFreeMealInWeek(due, { date: "2026-01-05", slot: "pranzo" })).toBe(true);
  });

  it("ragiona sui pasti: un pasto libero di più piatti conta come uno solo, e si esclude intero", () => {
    const week2 = [day("2026-01-06", [meal("p1", 400, true), meal("p2", 300, true), meal("p3", 200, true)])];
    expect(hasFreeMealInWeek(week2)).toBe(true);
    expect(hasFreeMealInWeek(week2, { date: "2026-01-06", slot: "pranzo" })).toBe(false);
  });
});
