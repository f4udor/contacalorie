import { describe, expect, it } from "vitest";
import { parseHealthDate, parseHealthField, parseKm, parseSteps } from "./parse";

describe("data", () => {
  it("aaaa-MM-gg e gg/MM/aaaa", () => {
    expect(parseHealthDate("2026-10-08")).toBe("2026-10-08");
    expect(parseHealthDate("08/10/2026")).toBe("2026-10-08");
    expect(parseHealthDate("8/1/2026")).toBe("2026-01-08");
  });
  it("date che non esistono", () => {
    expect(parseHealthDate("2026-02-30")).toBeNull();
    expect(parseHealthDate("31/04/2026")).toBeNull();
    expect(parseHealthDate("ieri")).toBeNull();
  });
});

describe("passi", () => {
  it.each([
    ["8123", 8123],
    ["8.123", 8123],
    ["8 123", 8123],
    ["8123,0", 8123],
    ["8123.0", 8123],
    ["8123 passi", 8123],
    ["8.123 conteggio", 8123],
    ["12.345", 12345],
    ["1.234.567", 1234567],
  ])("%s → %s", (text, value) => {
    expect(parseSteps(text)).toEqual({ value });
  });
  it("zero, negativo e testo non sono validi", () => {
    expect(parseSteps("0")).toEqual({ reason: "valore zero" });
    expect(parseSteps("-5")).toEqual({ reason: "valore negativo" });
    expect(parseSteps("")).toHaveProperty("reason");
    expect(parseSteps("molti")).toHaveProperty("reason");
  });
});

describe("km", () => {
  it.each([
    ["12,4", 12.4],
    ["12.4", 12.4],
    ["1.234", 1.23],
    ["12,4 km", 12.4],
    ["12.4km", 12.4],
    ["30", 30],
    ["12,3456", 12.35],
    ["1.234,5", 1234.5],
  ])("%s → %s", (text, value) => {
    expect(parseKm(text)).toEqual({ value });
  });
  it("zero e negativo", () => {
    expect(parseKm("0,0")).toEqual({ reason: "valore zero" });
    expect(parseKm("0,001")).toEqual({ reason: "valore zero" });
    expect(parseKm("-3")).toEqual({ reason: "valore negativo" });
    expect(parseKm("abc")).toHaveProperty("reason");
  });
});

describe("campo come testo", () => {
  it("separatori ; , tabulazione e spazi, righe vuote, a capo di Windows", () => {
    const text = "2026-10-08;8123\n\n2026-10-07, 7000\r\n2026-10-06\t6000\n2026-10-05    5000\n  \n2026-10-04,4000";
    const out = parseHealthField("passi", text);
    expect(out.discarded).toEqual([]);
    expect(out.entries).toEqual([
      { date: "2026-10-08", value: 8123 },
      { date: "2026-10-07", value: 7000 },
      { date: "2026-10-06", value: 6000 },
      { date: "2026-10-05", value: 5000 },
      { date: "2026-10-04", value: 4000 },
    ]);
  });
  it("la virgola dentro il valore dei km non rompe la riga", () => {
    expect(parseHealthField("bici_km", "2026-10-08;12,4\n2026-10-07, 3,5 km").entries).toEqual([
      { date: "2026-10-08", value: 12.4 },
      { date: "2026-10-07", value: 3.5 },
    ]);
  });
  it("data in formato italiano", () => {
    expect(parseHealthField("passi", "08/10/2026;8.123").entries).toEqual([{ date: "2026-10-08", value: 8123 }]);
  });
  it("righe illeggibili vanno tra le scartate con il motivo", () => {
    const out = parseHealthField("passi", "ciao\n2026-13-45;100\n2026-10-08;0\n2026-10-08;-4\n2026-10-08;boh\n2026-10-08");
    expect(out.entries).toEqual([]);
    expect(out.discarded.map((d) => d.motivo)).toEqual([
      "riga non leggibile: manca la data o il valore",
      "data non valida",
      "valore zero",
      "valore negativo",
      "valore non leggibile",
      "riga non leggibile: manca la data o il valore",
    ]);
  });
});

describe("campo come elenco", () => {
  it("oggetti con data e valore (numero o testo)", () => {
    const out = parseHealthField("passi", [
      { data: "2026-10-08", valore: 8123 },
      { data: "2026-10-07", valore: "7.000" },
      { data: "07/10/2026", valore: 8123.4 },
    ]);
    expect(out.entries).toEqual([
      { date: "2026-10-08", value: 8123 },
      { date: "2026-10-07", value: 7000 },
      { date: "2026-10-07", value: 8123 },
    ]);
  });
  it("km: due decimali e scartati", () => {
    const out = parseHealthField("bici_km", [{ data: "2026-10-08", valore: 12.456 }, { data: "2026-10-08", valore: 0 }, { data: "2026-10-08" }, "x", { data: 5, valore: 1 }]);
    expect(out.entries).toEqual([{ date: "2026-10-08", value: 12.46 }]);
    expect(out.discarded.map((d) => d.motivo)).toEqual(["valore zero", "valore mancante", "elemento non leggibile: serve data e valore", "elemento non leggibile: serve data e valore"]);
  });
  it("tipo sconosciuto", () => {
    expect(parseHealthField("passi", 42).discarded).toHaveLength(1);
    expect(parseHealthField("passi", undefined)).toEqual({ entries: [], discarded: [] });
  });
});
