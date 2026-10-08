import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "@/data";
import { activityToForm, buildActivityRecord, parseWhole, validateActivityForm, validateWeight } from "./activity-form";

describe("parseWhole", () => {
  it("interi con o senza punti delle migliaia", () => {
    expect(parseWhole("9000")).toBe(9000);
    expect(parseWhole("9.000")).toBe(9000);
    expect(parseWhole(" 12 345 ")).toBe(12345);
    expect(parseWhole("0")).toBe(0);
  });
  it("vuoto e non valido", () => {
    expect(parseWhole("")).toBe("empty");
    expect(parseWhole("9,5")).toBe("invalid");
    expect(parseWhole("abc")).toBe("invalid");
    expect(parseWhole("-3")).toBe("invalid");
  });
});

describe("validateActivityForm", () => {
  it("campi vuoti restano assenti, non zero", () => {
    expect(validateActivityForm({ steps: "", km: "", kcal: "" })).toEqual({ ok: true, activity: { steps: null, bikeKm: null, bikeKcal: null } });
  });
  it("valori validi, km con la virgola", () => {
    expect(validateActivityForm({ steps: "9.000", km: "30,5", kcal: "800" })).toEqual({ ok: true, activity: { steps: 9000, bikeKm: 30.5, bikeKcal: 800 } });
  });
  it("errori per campo", () => {
    const r = validateActivityForm({ steps: "tanti", km: "-2", kcal: "1,5" });
    expect(r).toEqual({ ok: false, errors: { steps: "Inserisci un numero intero", km: "Non può essere negativo", kcal: "Inserisci un numero intero" } });
  });
  it("zero è un valore valido", () => {
    expect(validateActivityForm({ steps: "0", km: "0", kcal: "" })).toEqual({ ok: true, activity: { steps: 0, bikeKm: 0, bikeKcal: null } });
  });
});

describe("activityToForm", () => {
  it("senza attività: modulo vuoto", () => {
    expect(activityToForm(null)).toEqual({ steps: "", km: "", kcal: "" });
  });
  it("riporta i valori come testo italiano", () => {
    const a: ActivityRecord = { date: "2026-01-05", steps: 9000, stepsSource: "manuale", bikeKm: 30.5, bikeKcalHealth: 800, bikeSource: "manuale" };
    expect(activityToForm(a)).toEqual({ steps: "9000", km: "30,5", kcal: "800" });
  });
});

describe("buildActivityRecord", () => {
  it("nuovi valori: fonte manuale; assenti: fonte null", () => {
    expect(buildActivityRecord("2026-01-05", { steps: 9000, bikeKm: null, bikeKcal: null }, null)).toEqual({
      date: "2026-01-05", steps: 9000, stepsSource: "manuale", bikeKm: null, bikeKcalHealth: null, bikeSource: null,
    });
    expect(buildActivityRecord("2026-01-05", { steps: null, bikeKm: 20, bikeKcal: 500 }, null)).toMatchObject({ bikeSource: "manuale", stepsSource: null });
  });
  it("un valore lasciato com'era mantiene la sua fonte, uno cambiato diventa manuale", () => {
    const existing: ActivityRecord = { date: "2026-01-05", steps: 8000, stepsSource: "salute", bikeKm: 20, bikeKcalHealth: 600, bikeSource: "salute" };
    const r = buildActivityRecord("2026-01-05", { steps: 8000, bikeKm: 25, bikeKcal: 600 }, existing);
    expect(r.stepsSource).toBe("salute");
    expect(r.bikeSource).toBe("manuale");
  });
});

describe("validateWeight", () => {
  it("accetta decimali con la virgola", () => {
    expect(validateWeight("92,5")).toEqual({ ok: true, weightKg: 92.5 });
  });
  it("rifiuta vuoto, testo, zero e negativi", () => {
    expect(validateWeight("")).toEqual({ ok: false, error: "Inserisci il peso in kg" });
    expect(validateWeight("novanta")).toEqual({ ok: false, error: "Inserisci un numero valido" });
    expect(validateWeight("0")).toEqual({ ok: false, error: "Il peso deve essere maggiore di zero" });
    expect(validateWeight("-4")).toEqual({ ok: false, error: "Il peso deve essere maggiore di zero" });
  });
});
