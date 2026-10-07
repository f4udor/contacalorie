import { describe, expect, it } from "vitest";
import { bikeBonus, bikeKcal, stepsBonus } from "./activity";
import { DEFAULT_SETTINGS } from "./defaults";

const s = DEFAULT_SETTINGS;
const none = { steps: null, bikeKm: null, bikeKcalHealth: null };

describe("bikeKcal", () => {
  it("usa le kcal di Salute se presenti, anche con i km", () => {
    expect(bikeKcal({ bikeKm: 30, bikeKcalHealth: 800 }, s)).toBe(800);
  });

  it("senza Salute usa km × kcal per km", () => {
    expect(bikeKcal({ bikeKm: 30, bikeKcalHealth: null }, s)).toBe(810);
  });

  it("senza bici: 0", () => {
    expect(bikeKcal(none, s)).toBe(0);
  });

  it("kcal di Salute pari a 0 restano 0 (valore presente)", () => {
    expect(bikeKcal({ bikeKm: 30, bikeKcalHealth: 0 }, s)).toBe(0);
  });
});

describe("bikeBonus", () => {
  it("caso E: 30 km a mano → bonus 405", () => {
    expect(bikeBonus({ bikeKm: 30, bikeKcalHealth: null }, s)).toBe(405);
  });

  it("caso F: 800 kcal da Salute → bonus 400", () => {
    expect(bikeBonus({ bikeKm: null, bikeKcalHealth: 800 }, s)).toBe(400);
  });

  it("arrotonda (0,5 × 27 = 13,5 → 14)", () => {
    expect(bikeBonus({ bikeKm: 1, bikeKcalHealth: null }, s)).toBe(14);
  });

  it("senza bici: 0", () => {
    expect(bikeBonus(none, s)).toBe(0);
  });
});

describe("stepsBonus", () => {
  it("caso A: 9.000 passi → bonus 75", () => {
    expect(stepsBonus({ steps: 9000 }, s)).toBe(75);
  });

  it("sotto la soglia: 0", () => {
    expect(stepsBonus({ steps: 5999 }, s)).toBe(0);
    expect(stepsBonus({ steps: 0 }, s)).toBe(0);
  });

  it("esattamente alla soglia: 0", () => {
    expect(stepsBonus({ steps: 6000 }, s)).toBe(0);
  });

  it("passi assenti: 0", () => {
    expect(stepsBonus({ steps: null }, s)).toBe(0);
  });

  it("arrotonda (6.001 passi → 0,025 → 0; 6.100 → 2,5 → 3)", () => {
    expect(stepsBonus({ steps: 6001 }, s)).toBe(0);
    expect(stepsBonus({ steps: 6100 }, s)).toBe(3);
  });
});
