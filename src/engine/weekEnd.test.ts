import { describe, expect, it } from "vitest";
import { weekEnd, weekStart } from "./index";

function errorOf(fn: () => unknown): Error {
  try {
    fn();
  } catch (e) {
    return e as Error;
  }
  throw new Error("La funzione non ha lanciato nessun errore");
}

describe("weekEnd (issue #96)", () => {
  it("è una funzione esportata da src/engine/index.ts", () => {
    expect(typeof weekEnd).toBe("function");
  });

  it("una data a metà settimana dà la domenica della stessa settimana", () => {
    expect(weekEnd("2026-11-17")).toBe("2026-11-22");
  });

  it("una domenica restituisce se stessa", () => {
    expect(weekEnd("2026-11-22")).toBe("2026-11-22");
  });

  it("un lunedì dà la domenica successiva", () => {
    expect(weekEnd("2026-11-23")).toBe("2026-11-29");
  });

  it("attraversa il cambio d'anno", () => {
    expect(weekEnd("2026-12-31")).toBe("2027-01-03");
  });

  it("una data non valida lancia lo stesso errore di weekStart", () => {
    for (const input of ["2026-02-30", "abc"]) {
      const expected = errorOf(() => weekStart(input));
      const actual = errorOf(() => weekEnd(input));
      expect(actual.message).toBe(expected.message);
      expect(actual.constructor).toBe(expected.constructor);
    }
  });
});
