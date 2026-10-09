import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, ringGreenAbove } from "./defaults";
import { lightCeiling, lightKcalRing, lightMinimum, lightRange } from "./traffic";

const s = DEFAULT_SETTINGS;

describe("lightMinimum (proteine, fibre)", () => {
  it("caso I: 125 su 140 → giallo", () => {
    expect(lightMinimum(125, 140, s)).toBe("giallo");
  });
  it("confine verde: 126 su 140 → verde", () => {
    expect(lightMinimum(126, 140, s)).toBe("verde");
  });
  it("confine rosso: 210 verde, 210,1 rosso (T × 1,5)", () => {
    expect(lightMinimum(210, 140, s)).toBe("verde");
    expect(lightMinimum(210.1, 140, s)).toBe("rosso");
  });
  it("zero assunto → giallo", () => {
    expect(lightMinimum(0, 30, s)).toBe("giallo");
  });
});

describe("lightRange (carboidrati, grassi)", () => {
  it("sotto T(1−m) giallo, al confine verde", () => {
    expect(lightRange(62.9, 70, s)).toBe("giallo");
    expect(lightRange(63, 70, s)).toBe("verde");
  });
  it("al confine alto verde, oltre rosso", () => {
    expect(lightRange(77, 70, s)).toBe("verde");
    expect(lightRange(77.1, 70, s)).toBe("rosso");
  });
  it("esattamente sull'obiettivo → verde", () => {
    expect(lightRange(70, 70, s)).toBe("verde");
  });
});

describe("lightCeiling (sale)", () => {
  it("caso J: 4,8 su 5 → giallo; 5,1 → rosso; 4,4 → verde", () => {
    expect(lightCeiling(4.8, 5, s)).toBe("giallo");
    expect(lightCeiling(5.1, 5, s)).toBe("rosso");
    expect(lightCeiling(4.4, 5, s)).toBe("verde");
  });
  it("confini: 4,5 giallo (inizio), 5 giallo (fine), appena oltre rosso", () => {
    expect(lightCeiling(4.5, 5, s)).toBe("giallo");
    expect(lightCeiling(5, 5, s)).toBe("giallo");
    expect(lightCeiling(5.0001, 5, s)).toBe("rosso");
    expect(lightCeiling(4.4999, 5, s)).toBe("verde");
  });
  it("zero assunto → verde", () => {
    expect(lightCeiling(0, 5, s)).toBe("verde");
  });
});

describe("lightKcalRing (caso S, obiettivo 2.100)", () => {
  it("sei valori di confine: 1.949 / 1.950 / 2.150 / 2.151 / 2.300 / 2.301", () => {
    expect([1949, 1950, 2150, 2151, 2300, 2301].map((k) => lightKcalRing(k, 2100))).toEqual(["accento", "verde", "verde", "giallo", "giallo", "rosso"]);
  });
  it("sull'obiettivo e poco sotto: verde", () => {
    expect(lightKcalRing(2100, 2100)).toBe("verde");
    expect(lightKcalRing(2000, 2100)).toBe("verde");
  });
  it("giorno senza pasti (0 kcal): accento", () => {
    expect(lightKcalRing(0, 2100)).toBe("accento");
  });
  it("le soglie sono quelle di defaults.ts, uguali per ogni obiettivo", () => {
    expect(lightKcalRing(1850, 2000)).toBe("verde");
    expect(lightKcalRing(1849, 2000)).toBe("accento");
    expect(lightKcalRing(2201, 2000)).toBe("rosso");
  });
  it("recoveryMin coincide con ringGreenAbove", () => {
    expect(s.recoveryMin).toBe(ringGreenAbove);
  });
});

describe("obiettivo 0 o negativo: stato neutro, nessun errore", () => {
  it("tutte le funzioni", () => {
    expect(lightMinimum(10, 0, s)).toBe("neutro");
    expect(lightRange(10, 0, s)).toBe("neutro");
    expect(lightCeiling(10, 0, s)).toBe("neutro");
    expect(lightKcalRing(10, 0)).toBe("neutro");
    expect(lightKcalRing(0, 0)).toBe("neutro");
    expect(lightMinimum(10, -5, s)).toBe("neutro");
  });
});

describe("margine personalizzato", () => {
  it("usa margin dalle impostazioni", () => {
    expect(lightRange(55, 100, { margin: 0.5 })).toBe("verde");
    expect(lightRange(49, 100, { margin: 0.5 })).toBe("giallo");
  });
});
