import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { nutrientTargets } from "./nutrients";

const s = DEFAULT_SETTINGS;

describe("nutrientTargets", () => {
  it("caso G: giorno base 2.100 → proteine 140, grassi 70, carboidrati 228", () => {
    expect(nutrientTargets(2100, 100, s)).toEqual({ protein: 140, carbs: 228, fat: 70, fiber: 30, salt: 5 });
  });

  it("caso E: obiettivo 2.505 → carboidrati 329", () => {
    expect(nutrientTargets(2505, 100, s).carbs).toBe(329);
  });

  it("caso F: obiettivo 2.500 → carboidrati 328", () => {
    expect(nutrientTargets(2500, 100, s).carbs).toBe(328);
  });

  it("proteine arrotondate ai 5 g (peso 83 → 116,2 → 115)", () => {
    expect(nutrientTargets(2100, 83, s).protein).toBe(115);
    expect(nutrientTargets(2100, 85, s).protein).toBe(120); // 119 → 120
  });

  it("grassi arrotondati ai 5 g (base 2.000 → 66,7 → 65)", () => {
    expect(nutrientTargets(2000, 100, { ...s, baseKcal: 2000 }).fat).toBe(65);
  });

  it("valori manuali di proteine e grassi sostituiscono la formula (senza arrotondare)", () => {
    const t = nutrientTargets(2100, 100, { ...s, proteinGramsManual: 123, fatGramsManual: 61 });
    expect(t.protein).toBe(123);
    expect(t.fat).toBe(61);
    expect(t.carbs).toBe(Math.round((2100 - 123 * 4 - 61 * 9) / 4));
  });

  it("un valore manuale pari a 0 è rispettato", () => {
    expect(nutrientTargets(2100, 100, { ...s, proteinGramsManual: 0 }).protein).toBe(0);
  });

  it("i carboidrati non sono mai negativi", () => {
    expect(nutrientTargets(500, 100, s).carbs).toBe(0);
    expect(nutrientTargets(0, 100, s).carbs).toBe(0);
  });

  it("fibre e sale vengono dalle impostazioni", () => {
    const t = nutrientTargets(2100, 100, { ...s, fiberMin: 25, saltMax: 6 });
    expect(t.fiber).toBe(25);
    expect(t.salt).toBe(6);
  });
});
