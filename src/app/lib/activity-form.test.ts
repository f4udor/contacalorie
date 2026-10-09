import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "@/data";
import { bikeToForm, hasManualBike, parseWhole, validateBikeForm, validateWeight, withManualBike, withoutManualBike } from "./activity-form";

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

const rec = (o: Partial<ActivityRecord> = {}): ActivityRecord => ({ date: "2026-01-05", steps: null, stepsSource: null, bikeKm: null, bikeKcalHealth: null, bikeSource: null, bikeKmManual: null, bikeKcalManual: null, ...o });

describe("validateBikeForm", () => {
  it("serve almeno uno tra km e kcal", () => {
    expect(validateBikeForm({ km: "", kcal: "" })).toEqual({ ok: false, errors: { km: "Inserisci i km o le kcal" } });
  });
  it("solo km, con la virgola", () => {
    expect(validateBikeForm({ km: "8,5", kcal: "" })).toEqual({ ok: true, bike: { km: 8.5, kcal: null } });
  });
  it("km e kcal", () => {
    expect(validateBikeForm({ km: "30", kcal: "800" })).toEqual({ ok: true, bike: { km: 30, kcal: 800 } });
  });
  it("solo kcal", () => {
    expect(validateBikeForm({ km: "", kcal: "250" })).toEqual({ ok: true, bike: { km: null, kcal: 250 } });
  });
  it("errori per campo", () => {
    expect(validateBikeForm({ km: "-2", kcal: "1,5" })).toEqual({ ok: false, errors: { km: "Non può essere negativo", kcal: "Inserisci un numero intero" } });
    expect(validateBikeForm({ km: "0", kcal: "" })).toEqual({ ok: false, errors: { km: "Deve essere maggiore di zero" } });
  });
});

describe("bikeToForm", () => {
  it("senza attività: modulo vuoto", () => {
    expect(bikeToForm(null)).toEqual({ km: "", kcal: "" });
  });
  it("riporta la parte a mano come testo italiano, non quella di Salute", () => {
    expect(bikeToForm(rec({ bikeKm: 12.4, bikeSource: "salute", bikeKmManual: 8.5, bikeKcalManual: 230 }))).toEqual({ km: "8,5", kcal: "230" });
  });
});

describe("parte a mano della bici nel giorno", () => {
  it("aggiungere la parte a mano non tocca passi e parte di Salute", () => {
    const existing = rec({ steps: 8000, stepsSource: "salute", bikeKm: 12.4, bikeSource: "salute" });
    expect(withManualBike("2026-01-05", { km: 8, kcal: null }, existing)).toEqual({ ...existing, bikeKmManual: 8, bikeKcalManual: null });
  });
  it("senza giorno esistente nasce un giorno con solo la parte a mano", () => {
    expect(withManualBike("2026-01-05", { km: 8, kcal: 200 }, null)).toEqual(rec({ bikeKmManual: 8, bikeKcalManual: 200 }));
  });
  it("modificare sostituisce la parte a mano", () => {
    const existing = rec({ bikeKmManual: 8, bikeKcalManual: 200 });
    expect(withManualBike("2026-01-05", { km: 10, kcal: null }, existing)).toMatchObject({ bikeKmManual: 10, bikeKcalManual: null });
  });
  it("eliminare lascia la parte di Salute; senza parte a mano restituisce null", () => {
    const existing = rec({ bikeKm: 12.4, bikeSource: "salute", bikeKmManual: 8, bikeKcalManual: 200 });
    expect(withoutManualBike(existing)).toEqual({ ...existing, bikeKmManual: null, bikeKcalManual: null });
    expect(withoutManualBike(rec({ bikeKm: 12.4, bikeSource: "salute" }))).toBeNull();
    expect(hasManualBike(existing)).toBe(true);
    expect(hasManualBike(rec())).toBe(false);
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
