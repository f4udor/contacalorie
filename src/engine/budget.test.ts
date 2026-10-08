import { describe, expect, it } from "vitest";
import { hasFreeMealInWeek, kcalBudget, kcalEaten, mealBudgetKcal } from "./budget";
import { DEFAULT_SETTINGS } from "./defaults";
import type { Day, Meal } from "./types";

function meal(id: string, kcal: number, isFree = false): Meal {
  return { id, name: id, slot: "pranzo", kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0, isFree };
}

function day(date: string, meals: Meal[]): Day {
  return { date, meals, activity: { steps: null, bikeKm: null, bikeKcalHealth: null } };
}

const s = DEFAULT_SETTINGS;

describe("mealBudgetKcal / kcalBudget", () => {
  it("pasto libero sopra il tetto conta il tetto", () => {
    expect(mealBudgetKcal(meal("a", 2250, true), s)).toBe(800);
  });

  it("pasto libero sotto il tetto conta il suo valore", () => {
    expect(mealBudgetKcal(meal("a", 600, true), s)).toBe(600);
  });

  it("pasto libero esattamente al tetto", () => {
    expect(mealBudgetKcal(meal("a", 800, true), s)).toBe(800);
  });

  it("pasto normale conta per intero anche se enorme", () => {
    expect(mealBudgetKcal(meal("a", 2250), s)).toBe(2250);
  });

  it("caso C: mercoledì con pranzo libero da 2.250 kcal → budget 1.800", () => {
    const meals = [meal("col", 400), meal("pranzo", 2250, true), meal("cena", 600)];
    expect(kcalBudget(meals, s)).toBe(1800);
  });

  it("rispetta un tetto personalizzato", () => {
    expect(kcalBudget([meal("a", 1000, true)], { freeMealCap: 500 })).toBe(500);
  });

  it("giorno senza pasti: 0", () => {
    expect(kcalBudget([], s)).toBe(0);
    expect(kcalEaten([])).toBe(0);
  });
});

describe("kcalEaten", () => {
  it("restituisce le kcal reali, senza tetto", () => {
    const meals = [meal("col", 400), meal("pranzo", 2250, true), meal("cena", 600)];
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

  it("escludendo il pasto libero stesso (modifica) risulta non usato", () => {
    expect(hasFreeMealInWeek(week, "b")).toBe(false);
  });

  it("escludere un altro pasto non cambia il risultato", () => {
    expect(hasFreeMealInWeek(week, "a")).toBe(true);
  });

  it("con due pasti liberi, escluderne uno lascia l'altro", () => {
    const due = [day("2026-01-05", [meal("x", 500, true)]), day("2026-01-06", [meal("y", 500, true)])];
    expect(hasFreeMealInWeek(due, "x")).toBe(true);
  });
});
