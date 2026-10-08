import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "@/data";
import { formatDateTime, receivedFromHealth, shouldWarnHealth } from "./health-link";

const NOW = new Date("2026-01-08T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

describe("avviso dei dati da Salute", () => {
  it("nessun codice: nessun avviso", () => {
    expect(shouldWarnHealth({ active: false, codeCreatedAt: null, lastSuccessAt: null }, NOW)).toBe(false);
    expect(shouldWarnHealth({ active: false, codeCreatedAt: hoursAgo(100), lastSuccessAt: hoursAgo(90) }, NOW)).toBe(false);
  });
  it("ultimo invio 23 ore fa: nessun avviso", () => {
    expect(shouldWarnHealth({ active: true, codeCreatedAt: hoursAgo(300), lastSuccessAt: hoursAgo(23) }, NOW)).toBe(false);
  });
  it("ultimo invio 25 ore fa: avviso", () => {
    expect(shouldWarnHealth({ active: true, codeCreatedAt: hoursAgo(300), lastSuccessAt: hoursAgo(25) }, NOW)).toBe(true);
  });
  it("mai arrivato dopo la creazione del codice: conta dalla creazione", () => {
    expect(shouldWarnHealth({ active: true, codeCreatedAt: hoursAgo(2), lastSuccessAt: null }, NOW)).toBe(false);
    expect(shouldWarnHealth({ active: true, codeCreatedAt: hoursAgo(30), lastSuccessAt: null }, NOW)).toBe(true);
  });
  it("esattamente 24 ore: non ancora", () => {
    expect(shouldWarnHealth({ active: true, codeCreatedAt: null, lastSuccessAt: hoursAgo(24) }, NOW)).toBe(false);
  });
  it("date illeggibili o mancanti: nessun avviso", () => {
    expect(shouldWarnHealth({ active: true, codeCreatedAt: null, lastSuccessAt: null }, NOW)).toBe(false);
    expect(shouldWarnHealth({ active: true, codeCreatedAt: "boh", lastSuccessAt: null }, NOW)).toBe(false);
  });
});

describe("valori ricevuti", () => {
  const rec = (date: string, o: Partial<ActivityRecord>): ActivityRecord => ({ date, steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, ...o });
  it("solo quelli con fonte salute, per i giorni chiesti", () => {
    const list = [rec("2026-01-08", { steps: 8000, stepsSource: "salute", bikeKm: 10, bikeSource: "manuale" }), rec("2026-01-07", { bikeKm: 5, bikeSource: "salute" }), rec("2026-01-06", { steps: 1, stepsSource: "salute" })];
    expect(receivedFromHealth(list, ["2026-01-08", "2026-01-07"])).toEqual([
      { date: "2026-01-08", steps: 8000, km: null },
      { date: "2026-01-07", steps: null, km: 5 },
    ]);
  });
  it("nessun valore: elenco vuoto", () => {
    expect(receivedFromHealth([], ["2026-01-08"])).toEqual([]);
  });
});

describe("data e ora", () => {
  it("formato italiano, o trattino se illeggibile", () => {
    expect(formatDateTime("2026-01-08T09:05:00")).toMatch(/^gio 8 gen, 09:05$/);
    expect(formatDateTime("x")).toBe("–");
  });
});
