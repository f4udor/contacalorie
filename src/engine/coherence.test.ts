import { describe, expect, it } from "vitest";
import { kcalFromMacros, needsKcalCheck } from "./coherence";

const dish = (kcal: number, protein: number, carbs: number, fat: number) => ({ kcal, protein, carbs, fat });

describe("kcalFromMacros", () => {
  it("4 × proteine + 4 × carboidrati + 9 × grassi", () => {
    expect(kcalFromMacros(dish(0, 13, 72, 6))).toBe(394);
    expect(kcalFromMacros(dish(0, 2, 18, 0))).toBe(80);
  });
});

describe("needsKcalCheck (caso T, U, V di §3.8)", () => {
  it("caso T: 110 kcal con kcalMacro 394 → da controllare", () => {
    expect(needsKcalCheck(dish(110, 13, 72, 6))).toBe(true);
  });
  it("caso U: la birra, 215 kcal con kcalMacro 80 → non segnalata (kcal più alte dei macro: l'alcol)", () => {
    expect(needsKcalCheck(dish(215, 2, 18, 0))).toBe(false);
  });
  it("caso V: 380 kcal con kcalMacro 394 → non segnalato", () => {
    expect(needsKcalCheck(dish(380, 13, 72, 6))).toBe(false);
  });
});

describe("soglie esatte: serve superare entrambe", () => {
  it("quota: kcalMacro 400, mancano esattamente il 20 % (80 kcal) → no; 81 → sì", () => {
    expect(needsKcalCheck(dish(320, 100, 0, 0))).toBe(false);
    expect(needsKcalCheck(dish(319, 100, 0, 0))).toBe(true);
  });
  it("minimo: kcalMacro 100, mancano esattamente 40 kcal → no (e 40 è oltre il 20 %); 41 → sì", () => {
    expect(needsKcalCheck(dish(60, 25, 0, 0))).toBe(false);
    expect(needsKcalCheck(dish(59, 25, 0, 0))).toBe(true);
  });
  it("oltre il 20 % ma entro 40 kcal: non segnalato (kcalMacro 100, dichiarate 70)", () => {
    expect(needsKcalCheck(dish(70, 25, 0, 0))).toBe(false);
  });
  it("oltre 40 kcal ma entro il 20 %: non segnalato (kcalMacro 1.000, dichiarate 850)", () => {
    expect(needsKcalCheck(dish(850, 250, 0, 0))).toBe(false);
  });
  it("valori personalizzati", () => {
    expect(needsKcalCheck(dish(300, 100, 0, 0), 0.5, 10)).toBe(false);
    expect(needsKcalCheck(dish(150, 100, 0, 0), 0.5, 10)).toBe(true);
  });
});

describe("numeri a zero", () => {
  it("tutto a zero: non segnalato", () => {
    expect(needsKcalCheck(dish(0, 0, 0, 0))).toBe(false);
  });
  it("kcal a zero con macro: segnalato; macro a zero con kcal: no", () => {
    expect(needsKcalCheck(dish(0, 10, 10, 5))).toBe(true);
    expect(needsKcalCheck(dish(200, 0, 0, 0))).toBe(false);
  });
});
