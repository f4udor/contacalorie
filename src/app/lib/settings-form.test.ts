import { describe, expect, it } from "vitest";
import { defaultsPatch, FIELD_KEYS, PERSONAL_KEYS, settingsToForm, validateSettingsForm } from "./settings-form";
import type { SettingsFormValues } from "./settings-form";

const empty = (): SettingsFormValues => Object.fromEntries(FIELD_KEYS.map((k) => [k, ""])) as SettingsFormValues;
const form = (over: Partial<SettingsFormValues>): SettingsFormValues => ({ ...empty(), ...over });

describe("validateSettingsForm", () => {
  it("modulo vuoto: tutti i campi tolti (valori predefiniti)", () => {
    const r = validateSettingsForm(empty());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.patch).sort()).toEqual([...FIELD_KEYS].sort());
      expect(Object.values(r.patch).every((v) => v === undefined)).toBe(true);
    }
  });

  it("valori validi con virgola, percentuali convertite in frazioni", () => {
    const r = validateSettingsForm(form({ weightKg: "92,5", baseKcal: "2.000".replace(".", ""), margin: "12,5", bonusShare: "40", kcalPerStep: "0,04", ageYears: "42", challengeStartDate: "2026-01-05" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch).toMatchObject({ weightKg: 92.5, baseKcal: 2000, margin: 0.125, bonusShare: 0.4, kcalPerStep: 0.04, ageYears: 42, challengeStartDate: "2026-01-05" });
    }
  });

  it("valori non validi: errore accanto al campo, nessun patch", () => {
    const r = validateSettingsForm(form({ weightKg: "novanta", baseKcal: "-5", ageYears: "40,5", saltMax: "0", margin: "80", challengeStartDate: "2026-02-30", kcalPerStep: "2", heightCm: "1000" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toEqual({
        weightKg: "Inserisci un numero valido",
        baseKcal: "Deve essere maggiore di zero",
        ageYears: "Inserisci un numero intero",
        saltMax: "Deve essere maggiore di zero",
        margin: "Al massimo 50 %",
        challengeStartDate: "Data non valida",
        kcalPerStep: "Al massimo 1",
        heightCm: "Al massimo 300",
      });
    }
  });

  it("un solo campo errato impedisce tutto il salvataggio", () => {
    const r = validateSettingsForm(form({ weightKg: "90", floorKcal: "-1" }));
    expect(r).toEqual({ ok: false, errors: { floorKcal: "Non può essere negativo" } });
  });

  it("zero è ammesso dove non serve un valore positivo", () => {
    const r = validateSettingsForm(form({ floorKcal: "0", kcalPerKm: "0", freeMealCap: "0", stepThreshold: "0", margin: "0" }));
    expect(r.ok && r.patch).toMatchObject({ floorKcal: 0, kcalPerKm: 0, freeMealCap: 0, stepThreshold: 0, margin: 0 });
  });

  it("passi con i punti delle migliaia", () => {
    const r = validateSettingsForm(form({ stepThreshold: "6.000" }));
    expect(r.ok && r.patch.stepThreshold).toBe(6000);
  });

  it("proteine e grassi manuali: zero valido, vuoto = formula", () => {
    const r = validateSettingsForm(form({ proteinGramsManual: "0", fatGramsManual: "" }));
    expect(r.ok && r.patch.proteinGramsManual).toBe(0);
    expect(r.ok && r.patch.fatGramsManual).toBeUndefined();
  });
});

describe("settingsToForm", () => {
  it("impostazioni vuote: modulo vuoto", () => {
    expect(Object.values(settingsToForm({})).every((v) => v === "")).toBe(true);
  });
  it("numeri come testo italiano, percentuali in punti percentuali", () => {
    const f = settingsToForm({ weightKg: 92.5, margin: 0.125, bonusShare: 0.5, kcalPerStep: 0.05, challengeStartDate: "2026-01-05", baseKcal: 2000 });
    expect(f).toMatchObject({ weightKg: "92,5", margin: "12,5", bonusShare: "50", kcalPerStep: "0,05", challengeStartDate: "2026-01-05", baseKcal: "2000" });
  });
  it("andata e ritorno senza perdere valori", () => {
    const saved = { weightKg: 92.5, heightCm: 178, margin: 0.1, bonusShare: 0.35, kcalPerKm: 27.5, proteinGramsManual: 150, challengeStartDate: "2026-01-05" };
    const r = validateSettingsForm(settingsToForm(saved));
    expect(r.ok && r.patch).toMatchObject(saved);
  });
});

describe("defaultsPatch", () => {
  it("toglie le regole ma non profilo e data della sfida", () => {
    const p = defaultsPatch();
    for (const k of PERSONAL_KEYS) expect(k in p).toBe(false);
    expect(Object.keys(p)).toHaveLength(FIELD_KEYS.length - PERSONAL_KEYS.length);
    expect(Object.values(p).every((v) => v === undefined)).toBe(true);
    expect("baseKcal" in p && "margin" in p && "proteinGramsManual" in p).toBe(true);
  });
});
