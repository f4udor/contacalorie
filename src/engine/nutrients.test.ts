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

  it("caso K: peso 105 kg, peso obiettivo 85 kg → proteine 155 g (1,8 × 85 = 153, ai 5 g)", () => {
    expect(nutrientTargets(2100, 105, s, 85).protein).toBe(155);
  });

  it("con il peso obiettivo il peso attuale non conta", () => {
    expect(nutrientTargets(2100, 60, s, 85).protein).toBe(155);
    expect(nutrientTargets(2100, 0, s, 85).protein).toBe(155);
  });

  it("senza peso obiettivo (assente, null, zero o negativo) resta 1,4 × peso attuale: 100 kg → 140 g", () => {
    expect(nutrientTargets(2100, 100, s).protein).toBe(140);
    expect(nutrientTargets(2100, 100, s, null).protein).toBe(140);
    expect(nutrientTargets(2100, 100, s, 0).protein).toBe(140);
    expect(nutrientTargets(2100, 100, s, -5).protein).toBe(140);
    expect(nutrientTargets(2100, 100, s, NaN).protein).toBe(140);
  });

  it("il valore manuale sostituisce sempre la formula, anche con il peso obiettivo", () => {
    expect(nutrientTargets(2100, 100, { ...s, proteinGramsManual: 120 }, 85).protein).toBe(120);
  });

  it("i carboidrati seguono le proteine calcolate sul peso obiettivo", () => {
    // proteine 155, grassi 70: (2100 − 620 − 630) / 4 = 212,5 → 213
    expect(nutrientTargets(2100, 105, s, 85).carbs).toBe(213);
  });

  it("il coefficiente per il peso obiettivo viene dalle impostazioni", () => {
    expect(nutrientTargets(2100, 100, { ...s, proteinPerKgTarget: 2 }, 80).protein).toBe(160);
  });
});
