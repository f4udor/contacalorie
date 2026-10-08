import { describe, expect, it } from "vitest";
import { bikeBonus, bikeKcal, bikeKmTotal, stepsBonus } from "./activity";
import type { Activity } from "./types";
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

describe("bici: parte di Salute e parte a mano (T5b.0)", () => {
  const s = { ...DEFAULT_SETTINGS };
  const act = (a: Partial<Activity>): Activity => ({ steps: null, bikeKm: null, bikeKcalHealth: null, bikeKmManual: null, bikeKcalManual: null, ...a });

  it("solo Salute: km × kcal per km", () => {
    expect(bikeKmTotal(act({ bikeKm: 12 }))).toBe(12);
    expect(bikeKcal(act({ bikeKm: 12 }), s)).toBe(324);
  });
  it("solo a mano: km a mano × kcal per km", () => {
    expect(bikeKmTotal(act({ bikeKmManual: 8 }))).toBe(8);
    expect(bikeKcal(act({ bikeKmManual: 8 }), s)).toBe(216);
  });
  it("entrambe: i km e le kcal si sommano", () => {
    const a = act({ bikeKm: 10, bikeKmManual: 8 });
    expect(bikeKmTotal(a)).toBe(18);
    expect(bikeKcal(a, s)).toBe(10 * 27 + 8 * 27);
    expect(bikeBonus(a, s)).toBe(Math.round(0.5 * 486));
  });
  it("kcal a mano presenti: sostituiscono km a mano × kcal per km, non toccano la parte di Salute", () => {
    expect(bikeKcal(act({ bikeKm: 10, bikeKmManual: 8, bikeKcalManual: 300 }), s)).toBe(270 + 300);
    expect(bikeKcal(act({ bikeKcalManual: 300 }), s)).toBe(300);
  });
  it("kcal a mano assenti: si calcolano dai km a mano", () => {
    expect(bikeKcal(act({ bikeKmManual: 10, bikeKcalManual: null }), s)).toBe(270);
  });
  it("senza bici: nessun km e 0 kcal", () => {
    expect(bikeKmTotal(act({}))).toBeNull();
    expect(bikeKcal(act({}), s)).toBe(0);
  });
  it("giorni senza i campi nuovi (come nei test di E e F) funzionano come prima", () => {
    expect(bikeKcal({ bikeKm: null, bikeKcalHealth: 800 }, s)).toBe(800);
    expect(bikeKmTotal({ bikeKm: 30 })).toBe(30);
  });
});
