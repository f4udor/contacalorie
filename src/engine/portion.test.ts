import { describe, expect, it } from "vitest";
import { roundHalfUp, scaleNutrients, weightRatio } from "./portion";

const piatto = { kcal: 300, protein: 12, carbs: 40, fat: 8, fiber: 4, salt: 1 };

describe("quantità ricalcolata senza AI (§4.1, casi AT e AU)", () => {
  it("caso AT: 200 g, 300 kcal, carboidrati 40,0 g; peso 250 g → 375 kcal, carboidrati 50,0 g", () => {
    const r = weightRatio(200, 250);
    expect(r).toBe(1.25);
    expect(scaleNutrients(piatto, r!)).toMatchObject({ kcal: 375, carbs: 50 });
  });
  it("caso AU: senza peso, 420 kcal, grassi 13,3 g; porzioni ×1,5 → 630 kcal, grassi 20,0 g (19,95 arrotondato)", () => {
    const r = scaleNutrients({ kcal: 420, protein: 10, carbs: 30, fat: 13.3, fiber: 2, salt: 1 }, 1.5);
    expect(r).toMatchObject({ kcal: 630, fat: 20 });
  });
  it("rapporto 1: i valori restano quelli di partenza, anche con decimali", () => {
    const base = { kcal: 321.5, protein: 12.34, carbs: 40, fat: 9.5, fiber: 3, salt: 1.1 };
    expect(scaleNutrients(base, 1)).toEqual(base);
    expect(weightRatio(200, 200)).toBe(1);
  });
  it("valori a zero restano a zero", () => {
    expect(scaleNutrients({ kcal: 100, protein: 0, carbs: 25, fat: 0, fiber: 0, salt: 0 }, 2.5)).toEqual({ kcal: 250, protein: 0, carbs: 62.5, fat: 0, fiber: 0, salt: 0 });
  });
  it("kcal all'intero, nutrienti a un decimale", () => {
    const r = scaleNutrients({ kcal: 100, protein: 3.33, carbs: 7, fat: 1, fiber: 1, salt: 0.37 }, 1 / 3)!;
    expect(r.kcal).toBe(33);
    expect(r.protein).toBe(1.1);
    expect(r.salt).toBe(0.1);
  });
  it("tornare al peso di partenza riporta i numeri di partenza (si ricalcola sempre dalla base)", () => {
    const a = scaleNutrients(piatto, weightRatio(200, 250)!)!;
    expect(a.kcal).toBe(375);
    expect(scaleNutrients(piatto, weightRatio(200, 200)!)).toEqual(piatto);
  });
  it("rapporto o pesi non validi: nessun risultato", () => {
    expect(scaleNutrients(piatto, 0)).toBeNull();
    expect(scaleNutrients(piatto, -1)).toBeNull();
    expect(scaleNutrients(piatto, Number.NaN)).toBeNull();
    expect(weightRatio(0, 100)).toBeNull();
    expect(weightRatio(100, 0)).toBeNull();
  });
  it("roundHalfUp: il mezzo va in su sul valore decimale", () => {
    expect(roundHalfUp(19.95, 1)).toBe(20);
    expect(roundHalfUp(2.5, 0)).toBe(3);
    expect(roundHalfUp(1.004, 2)).toBe(1);
  });
});
