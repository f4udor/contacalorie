import { describe, expect, it } from "vitest";
import { UNKNOWN_WEIGHT_WARNING, favoriteDishFromQuantity, roundHalfUp, scaleNutrients, weightRatio } from "./portion";

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

describe("preferiti nella stima (§4.1, casi AN-AS)", () => {
  const hummus = { weightG: 150, quantity: "150 g", kcal: 150, protein: 7.5, carbs: 10, fat: 9, fiber: 4, salt: 0.5 };
  const caffe = { weightG: null, quantity: null, kcal: 20, protein: 0, carbs: 5, fat: 0, fiber: 0, salt: 0 };
  it("caso AN: 150 g, 150 kcal, proteine 7,5; «100 g» → 100 kcal, proteine 5,0, peso 100 g, quantità «100 g»", () => {
    const r = favoriteDishFromQuantity(hummus, { unit: "g", amount: 100 });
    expect(r).toMatchObject({ weightG: 100, quantityText: "100 g", assumed: false, warning: null });
    expect(r.numbers).toMatchObject({ kcal: 100, protein: 5 });
  });
  it("caso AO: «220 g» → 220 kcal, proteine 11,0", () => {
    const r = favoriteDishFromQuantity(hummus, { unit: "g", amount: 220 });
    expect(r.numbers).toMatchObject({ kcal: 220, protein: 11 });
    expect(r.weightG).toBe(220);
  });
  it("caso AP: «2 porzioni» → 300 kcal, proteine 15,0, peso 300 g", () => {
    const r = favoriteDishFromQuantity(hummus, { unit: "porzioni", amount: 2 });
    expect(r).toMatchObject({ weightG: 300, quantityText: "2 porzioni", assumed: false });
    expect(r.numbers).toMatchObject({ kcal: 300, protein: 15 });
  });
  it("caso AQ: senza quantità → 150 kcal, peso 150 g, quantità ipotizzata", () => {
    const r = favoriteDishFromQuantity(hummus, null);
    expect(r).toMatchObject({ weightG: 150, assumed: true, quantityText: "150 g", warning: null });
    expect(r.numbers.kcal).toBe(150);
  });
  it("caso AR: preferito senza peso, «×2» (2 porzioni) → 40 kcal, quantità «2 porzioni»", () => {
    const r = favoriteDishFromQuantity(caffe, { unit: "porzioni", amount: 2 });
    expect(r).toMatchObject({ quantityText: "2 porzioni", weightG: null, assumed: false, warning: null });
    expect(r.numbers.kcal).toBe(40);
  });
  it("caso AS: preferito senza peso e «100 g» → 20 kcal e l'avviso «Peso del preferito sconosciuto»", () => {
    const r = favoriteDishFromQuantity(caffe, { unit: "g", amount: 100 });
    expect(r.numbers.kcal).toBe(20);
    expect(r.warning).toBe(UNKNOWN_WEIGHT_WARNING);
    expect(r.assumed).toBe(true);
    expect(r.quantityText).toBe("1 porzione");
  });
  it("mezza porzione, porzioni con la virgola, una sola porzione", () => {
    expect(favoriteDishFromQuantity(hummus, { unit: "porzioni", amount: 0.5 })).toMatchObject({ quantityText: "0,5 porzioni", weightG: 75 });
    expect(favoriteDishFromQuantity(hummus, { unit: "porzioni", amount: 1.5 }).quantityText).toBe("1,5 porzioni");
    expect(favoriteDishFromQuantity(hummus, { unit: "porzioni", amount: 1 }).quantityText).toBe("1 porzione");
  });
  it("quantità non positiva o non valida: come non detta", () => {
    expect(favoriteDishFromQuantity(hummus, { unit: "g", amount: 0 }).assumed).toBe(true);
    expect(favoriteDishFromQuantity(hummus, { unit: "porzioni", amount: -2 }).numbers.kcal).toBe(150);
  });
  it("un preferito senza quantità salvata e nessuna quantità detta: «1 porzione», ipotizzata", () => {
    expect(favoriteDishFromQuantity(caffe, null)).toMatchObject({ quantityText: "1 porzione", assumed: true });
  });
});
