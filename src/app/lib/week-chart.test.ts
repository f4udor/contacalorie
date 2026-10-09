import { describe, expect, it } from "vitest";
import { GRID_Y, hasAnyValue, miniBarRatios, ratioToY, stepPath } from "./week-chart";

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
