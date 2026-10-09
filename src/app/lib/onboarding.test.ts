import { describe, expect, it } from "vitest";
import { checkOnboardingStep, initialOnboardingValues, needsOnboarding, onboardingPatch, onboardingSummary, ONBOARDING_STEPS, SKIP_PATCH } from "./onboarding";

const full = { sex: "uomo", ageYears: "27", heightCm: "180", weightKg: "100", targetWeightKg: "", targetDate: "", baseKcal: "" };

describe("needsOnboarding", () => {
  it("solo senza impostazioni e senza segno di avvio fatto", () => {
    expect(needsOnboarding({})).toBe(true);
    expect(needsOnboarding({ onboardingDone: true })).toBe(false);
    expect(needsOnboarding({ weightKg: 90 })).toBe(false);
    expect(needsOnboarding({ onboardingDone: false })).toBe(false);
  });
});

describe("onboardingPatch", () => {
  it("chiede sesso, età, altezza, peso, peso obiettivo e data, poi le kcal", () => {
    expect(ONBOARDING_STEPS.flat()).toEqual(["sex", "ageYears", "heightCm", "weightKg", "targetWeightKg", "targetDate", "baseKcal"]);
  });
  it("tutto vuoto: si salva solo il segno di avvio fatto", () => {
    expect(onboardingPatch(initialOnboardingValues())).toEqual({ ok: true, patch: { onboardingDone: true } });
  });
  it("campi scritti: virgola accettata, data e sesso salvati, kcal vuote non salvate (calcolate)", () => {
    const r = onboardingPatch({ ...full, weightKg: "92,5", targetWeightKg: "82", targetDate: "2026-12-31" });
    expect(r).toEqual({ ok: true, patch: { onboardingDone: true, sex: "uomo", ageYears: 27, heightCm: 180, weightKg: 92.5, targetWeightKg: 82, targetDate: "2026-12-31" } });
  });
  it("kcal base scritta a mano: si salva (personalizzata)", () => {
    const r = onboardingPatch({ ...full, baseKcal: "2000" });
    expect(r.ok && r.patch.baseKcal).toBe(2000);
  });
  it("valori non validi: errori accanto al campo giusto", () => {
    const r = onboardingPatch({ ...initialOnboardingValues(), weightKg: "novanta", targetWeightKg: "-3", baseKcal: "0", targetDate: "ieri" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual({ weightKg: "Inserisci un numero valido", targetWeightKg: "Deve essere maggiore di zero", baseKcal: "Deve essere maggiore di zero", targetDate: "Inserisci una data valida" });
  });
  it("ogni schermata controlla solo i suoi campi", () => {
    const v = { ...initialOnboardingValues(), weightKg: "novanta" };
    expect(checkOnboardingStep(v, ONBOARDING_STEPS[0])).toEqual({});
    expect(checkOnboardingStep(v, ONBOARDING_STEPS[1])).toEqual({ weightKg: "Inserisci un numero valido" });
  });
  it("saltare: solo il segno", () => {
    expect(SKIP_PATCH).toEqual({ onboardingDone: true });
  });
});

describe("onboardingSummary", () => {
  const today = "2026-01-01";
  it("profilo completo: kcal base calcolata e basale (AA/AD)", () => {
    expect(onboardingSummary(full, today)).toEqual({ baseKcal: 2390, minimum: 2000, calculated: true, earliestDate: null });
  });
  it("con peso obiettivo raggiungibile (AB)", () => {
    expect(onboardingSummary({ ...full, targetWeightKg: "90", targetDate: "2026-10-28" }, today)).toMatchObject({ baseKcal: 2140, minimum: 2000 });
  });
  it("piano non raggiungibile (AC): base al minimo e prima data possibile", () => {
    expect(onboardingSummary({ ...full, targetWeightKg: "90", targetDate: "2026-04-11" }, today)).toEqual({ baseKcal: 2000, minimum: 2000, calculated: true, earliestDate: "2026-07-16" });
  });
  it("si può cambiare la base a mano: vale quella", () => {
    expect(onboardingSummary({ ...full, baseKcal: "2100" }, today)).toMatchObject({ baseKcal: 2100, minimum: 2000, calculated: true });
  });
  it("profilo incompleto (AH): kcal predefinite, nessun basale", () => {
    expect(onboardingSummary({ ...initialOnboardingValues(), ageYears: "27" }, today)).toEqual({ baseKcal: 2100, minimum: null, calculated: false, earliestDate: null });
  });
  it("valori non validi: nessun riepilogo", () => {
    expect(onboardingSummary({ ...full, ageYears: "x" }, today)).toBeNull();
  });
});
