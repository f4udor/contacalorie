import { describe, expect, it } from "vitest";
import { initialOnboardingValues, needsOnboarding, onboardingPatch, SKIP_PATCH } from "./onboarding";

describe("needsOnboarding", () => {
  it("solo senza impostazioni e senza segno di avvio fatto", () => {
    expect(needsOnboarding({})).toBe(true);
    expect(needsOnboarding({ onboardingDone: true })).toBe(false);
    expect(needsOnboarding({ weightKg: 90 })).toBe(false);
    expect(needsOnboarding({ onboardingDone: false })).toBe(false);
  });
});

describe("onboardingPatch", () => {
  it("parte con le kcal predefinite e i pesi vuoti", () => {
    expect(initialOnboardingValues()).toEqual({ weightKg: "", targetWeightKg: "", baseKcal: "2100" });
  });
  it("tutto lasciato com'è: si salva solo il segno di avvio fatto", () => {
    expect(onboardingPatch(initialOnboardingValues())).toEqual({ ok: true, patch: { onboardingDone: true } });
  });
  it("pesi e kcal diverse dalle predefinite: virgola accettata", () => {
    expect(onboardingPatch({ weightKg: "92,5", targetWeightKg: "82", baseKcal: "2000" })).toEqual({ ok: true, patch: { onboardingDone: true, weightKg: 92.5, targetWeightKg: 82, baseKcal: 2000 } });
  });
  it("kcal vuote: restano le predefinite (non si salva nulla)", () => {
    const r = onboardingPatch({ weightKg: "90", targetWeightKg: "", baseKcal: "" });
    expect(r).toEqual({ ok: true, patch: { onboardingDone: true, weightKg: 90 } });
  });
  it("valori non validi: errori accanto al campo giusto, nulla da salvare", () => {
    const r = onboardingPatch({ weightKg: "novanta", targetWeightKg: "-3", baseKcal: "0" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual({ weightKg: "Inserisci un numero valido", targetWeightKg: "Deve essere maggiore di zero", baseKcal: "Deve essere maggiore di zero" });
  });
  it("saltare: solo il segno", () => {
    expect(SKIP_PATCH).toEqual({ onboardingDone: true });
  });
});
