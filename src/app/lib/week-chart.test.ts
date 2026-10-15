import { describe, expect, it } from "vitest";
import { GRID_Y, canLabelBar, hasAnyValue, miniBarRatios, nextLabeledBar, ratioToY, stepPath, visibleLabeledBar } from "./week-chart";

describe("linea dell'obiettivo a gradini", () => {
  it("un obiettivo costante è una linea orizzontale continua da lunedì a domenica", () => {
    expect(stepPath(Array(7).fill(0.5))).toBe("M0,50 H14.29 H28.57 H42.86 H57.14 H71.43 H85.71 H100");
  });
  it("dove l'obiettivo cambia c'è un gradino verticale, senza interruzioni", () => {
    // Lunedì e martedì a 0,5; mercoledì scende a 0,45: un salto di y da 50 a 55 al confine tra martedì e mercoledì.
    const d = stepPath([0.5, 0.5, 0.45, 0.45, 0.45, 0.45, 0.45]);
    expect(d.startsWith("M0,50 H14.29 H28.57 V55 H42.86")).toBe(true);
    expect(d.endsWith("H100")).toBe(true);
    expect(d.match(/M/g)).toHaveLength(1);
  });
  it("anche nei giorni futuri e nelle settimane senza dati la linea c'è (tutti i sette giorni hanno un obiettivo)", () => {
    const d = stepPath([0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]);
    expect(d.split(" ").filter((p) => p.startsWith("H"))).toHaveLength(7);
  });
  it("nessun giorno: nessuna linea", () => {
    expect(stepPath([])).toBe("");
  });
  it("il rapporto diventa y dall'alto, tenuto dentro il grafico", () => {
    expect(ratioToY(0)).toBe(100);
    expect(ratioToY(1)).toBe(0);
    expect(ratioToY(1.4)).toBe(0);
    expect(ratioToY(-1)).toBe(100);
  });
  it("la griglia ha tre linee dentro il grafico", () => {
    expect(GRID_Y).toEqual([25, 50, 75]);
  });
});

describe("mini grafici di passi e bici", () => {
  it("la scala è il massimo della settimana: la barra più alta arriva in cima", () => {
    expect(miniBarRatios([7200, 9100, 5400, 1942, null, null, null])).toEqual([7200 / 9100, 1, 5400 / 9100, 1942 / 9100, 0, 0, 0]);
  });
  it("settimana senza dati: tutte le barre a zero (griglia vuota)", () => {
    expect(miniBarRatios([null, null, null, null, null, null, null])).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(hasAnyValue([null, 0, null])).toBe(false);
  });
  it("un solo giorno con un valore: la sua barra arriva in cima", () => {
    expect(miniBarRatios([null, 45.5, null, null, null, null, null])[1]).toBe(1);
    expect(hasAnyValue([null, 45.5])).toBe(true);
  });
  it("i valori a zero non hanno barra", () => {
    expect(miniBarRatios([0, 10])).toEqual([0, 1]);
  });
});

describe("etichetta delle kcal toccando una barra (T6b.5)", () => {
  const TODAY = "2026-01-08";
  const bars = [
    { date: "2026-01-05", hasMeals: true },
    { date: "2026-01-06", hasMeals: true },
    { date: "2026-01-07", hasMeals: false },
    { date: "2026-01-08", hasMeals: true },
    { date: "2026-01-09", hasMeals: true }, // futuro (dati inseriti in anticipo)
    { date: "2026-01-10", hasMeals: false },
    { date: "2026-01-11", hasMeals: false },
  ];
  it("un tocco su una barra con pasti mostra la sua etichetta", () => {
    expect(nextLabeledBar(null, "2026-01-05", bars, TODAY)).toBe("2026-01-05");
  });
  it("un secondo tocco sulla stessa barra la toglie", () => {
    expect(nextLabeledBar("2026-01-05", "2026-01-05", bars, TODAY)).toBeNull();
  });
  it("un tocco su un'altra barra sposta l'etichetta: una sola alla volta", () => {
    expect(nextLabeledBar("2026-01-05", "2026-01-06", bars, TODAY)).toBe("2026-01-06");
  });
  it("giorno senza pasti: nessuna etichetta, e quella che c'era si toglie", () => {
    expect(nextLabeledBar(null, "2026-01-07", bars, TODAY)).toBeNull();
    expect(nextLabeledBar("2026-01-05", "2026-01-07", bars, TODAY)).toBeNull();
  });
  it("giorno futuro: nessuna etichetta, anche se ha pasti", () => {
    expect(canLabelBar(bars[4], TODAY)).toBe(false);
    expect(nextLabeledBar(null, "2026-01-09", bars, TODAY)).toBeNull();
  });
  it("oggi, con pasti, ha l'etichetta", () => {
    expect(nextLabeledBar(null, TODAY, bars, TODAY)).toBe(TODAY);
  });
  it("cambiando settimana l'etichetta sparisce: la barra scelta non è più tra quelle mostrate", () => {
    const next = [{ date: "2025-12-29", hasMeals: true }, { date: "2025-12-30", hasMeals: false }];
    expect(visibleLabeledBar("2026-01-05", bars, TODAY)).toBe("2026-01-05");
    expect(visibleLabeledBar("2026-01-05", next, TODAY)).toBeNull();
    expect(visibleLabeledBar(null, bars, TODAY)).toBeNull();
  });
});
