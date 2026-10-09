import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { computePlan, isProfileComplete, resolveSettings, roundHalfAway } from "./profile";
import type { Profile } from "./profile";

const TODAY = "2026-01-01";
const man: Profile = { sex: "uomo", ageYears: 27, heightCm: 180, weightKg: 100 };
const at = (days: number) => {
  const t = new Date(Date.UTC(2026, 0, 1 + days));
  return t.toISOString().slice(0, 10);
};

describe("obiettivi calcolati dal profilo (BRIEF §3.9)", () => {
  it("AA: uomo, 27 anni, 180 cm, 100 kg: basale 1.995, minimo 2.000, fabbisogno 2.394", () => {
    const p = computePlan(man, TODAY)!;
    expect(p.basal).toBe(1995);
    expect(p.minimum).toBe(2000);
    expect(Math.round(p.maintenance)).toBe(2394);
  });

  it("AB: obiettivo 90 kg tra 300 giorni: scarto 257, kcal base 2.140", () => {
    const p = computePlan({ ...man, targetWeightKg: 90, targetDate: at(300) }, TODAY)!;
    expect(Math.round(p.dailyGap)).toBe(257);
    expect(p.calculatedBaseKcal).toBe(2140);
    expect(p.unreachable).toBe(false);
    expect(p.earliestDays).toBeNull();
  });

  it("AC: obiettivo 90 kg tra 100 giorni: scarto 770, non raggiungibile, base 2.000, prima data possibile tra 196 giorni", () => {
    const p = computePlan({ ...man, targetWeightKg: 90, targetDate: at(100) }, TODAY)!;
    expect(Math.round(p.dailyGap)).toBe(770);
    expect(p.unreachable).toBe(true);
    expect(p.calculatedBaseKcal).toBe(2000);
    expect(p.earliestDays).toBe(196);
    expect(p.earliestDate).toBe(at(196));
  });

  it("AD: senza peso obiettivo: kcal base 2.390", () => {
    const p = computePlan(man, TODAY)!;
    expect(p.dailyGap).toBe(0);
    expect(p.calculatedBaseKcal).toBe(2390);
  });

  it("AE: donna, 30 anni, 165 cm, 65 kg: basale 1.370 (1.370,25), minimo 1.370, fabbisogno 1.644", () => {
    const p = computePlan({ sex: "donna", ageYears: 30, heightCm: 165, weightKg: 65 }, TODAY)!;
    expect(p.basal).toBe(1370.25);
    expect(p.minimum).toBe(1370);
    expect(Math.round(p.maintenance)).toBe(1644);
  });

  it("AF: uomo, 25 anni, 175 cm, 60 kg, obiettivo 65 kg tra 200 giorni: basale 1.574, fabbisogno 1.889, scarto −193, base 2.080", () => {
    const p = computePlan({ sex: "uomo", ageYears: 25, heightCm: 175, weightKg: 60, targetWeightKg: 65, targetDate: at(200) }, TODAY)!;
    expect(Math.round(p.basal)).toBe(1574);
    expect(Math.round(p.maintenance)).toBe(1889);
    expect(roundHalfAway(p.dailyGap)).toBe(-193);
    expect(p.calculatedBaseKcal).toBe(2080);
    expect(p.unreachable).toBe(false);
  });

  it("AG: come AB con kcal base scritta a mano 2.100: base 2.100, minimo 2.000", () => {
    const r = resolveSettings({ ...man, targetWeightKg: 90, targetDate: at(300), baseKcal: 2100 }, TODAY);
    expect(r.settings.baseKcal).toBe(2100);
    expect(r.settings.floorKcal).toBe(2000);
    expect(r.baseIsManual).toBe(true);
  });

  it("AH: profilo senza sesso: base 2.100, minimo 1.800", () => {
    const r = resolveSettings({ ageYears: 27, heightCm: 180, weightKg: 100 }, TODAY);
    expect(r.plan).toBeNull();
    expect(r.settings.baseKcal).toBe(2100);
    expect(r.settings.floorKcal).toBe(1800);
    expect(r.baseIsManual).toBe(false);
  });

  it("senza nessuna impostazione valgono i default di oggi", () => {
    const r = resolveSettings({}, TODAY);
    expect(r.settings).toEqual(DEFAULT_SETTINGS);
    expect(resolveSettings(null, TODAY).settings).toEqual(DEFAULT_SETTINGS);
  });

  it("senza kcal a mano la base è quella calcolata (AB via resolveSettings)", () => {
    const r = resolveSettings({ ...man, targetWeightKg: 90, targetDate: at(300) }, TODAY);
    expect(r.settings.baseKcal).toBe(2140);
    expect(r.settings.floorKcal).toBe(2000);
    expect(r.baseIsManual).toBe(false);
  });

  it("data passata o di oggi: scarto 0", () => {
    for (const targetDate of [at(-10), TODAY]) {
      const p = computePlan({ ...man, targetWeightKg: 90, targetDate }, TODAY)!;
      expect(p.dailyGap).toBe(0);
      expect(p.calculatedBaseKcal).toBe(2390);
      expect(p.unreachable).toBe(false);
    }
  });

  it("peso obiettivo già raggiunto: scarto 0; senza data: scarto 0", () => {
    expect(computePlan({ ...man, targetWeightKg: 100, targetDate: at(100) }, TODAY)!.dailyGap).toBe(0);
    expect(computePlan({ ...man, targetWeightKg: 90 }, TODAY)!.dailyGap).toBe(0);
  });

  it("il peso è l'ultima pesata, se c'è, invece di quello del profilo", () => {
    // Profilo 100 kg ma ultima pesata 90 kg: il basale scende di 100 kcal.
    const fromProfile = resolveSettings({ ...man }, TODAY);
    const fromWeighIn = resolveSettings({ ...man }, TODAY, 90);
    expect(fromProfile.plan!.basal).toBe(1995);
    expect(fromWeighIn.plan!.basal).toBe(1895);
    expect(fromWeighIn.settings.floorKcal).toBe(1900);
    // Senza peso nel profilo basta la pesata.
    expect(resolveSettings({ sex: "uomo", ageYears: 27, heightCm: 180 }, TODAY, 90).plan).not.toBeNull();
  });

  it("utente esistente con kcal base salvata: la tiene; la soglia minima diventa il basale appena il profilo è completo", () => {
    const saved = { baseKcal: 2000, floorKcal: 1700, ...man };
    const r = resolveSettings(saved, TODAY);
    expect(r.settings.baseKcal).toBe(2000);
    expect(r.baseIsManual).toBe(true);
    expect(r.settings.floorKcal).toBe(2000);
    // Profilo incompleto: tiene anche la soglia salvata.
    const incomplete = resolveSettings({ baseKcal: 2000, floorKcal: 1700 }, TODAY);
    expect(incomplete.settings.baseKcal).toBe(2000);
    expect(incomplete.settings.floorKcal).toBe(1700);
  });

  it("profilo completo solo con sesso, età, altezza e peso", () => {
    expect(isProfileComplete(man)).toBe(true);
    expect(isProfileComplete({ ...man, sex: null })).toBe(false);
    expect(isProfileComplete({ ...man, ageYears: 0 })).toBe(false);
    expect(isProfileComplete({ ...man, heightCm: undefined })).toBe(false);
    expect(isProfileComplete({ ...man, weightKg: null })).toBe(false);
    expect(computePlan({ ...man, sex: null }, TODAY)).toBeNull();
  });

  it("chi vuole salire: scarto negativo, base sopra il fabbisogno; mai sotto il minimo", () => {
    const p = computePlan({ ...man, targetWeightKg: 110, targetDate: at(300) }, TODAY)!;
    expect(p.dailyGap).toBeLessThan(0);
    expect(p.calculatedBaseKcal).toBeGreaterThan(2394);
    expect(p.unreachable).toBe(false);
  });
});

describe("arrotondamento dello scarto", () => {
  it("i mezzi si arrotondano lontano dallo zero", () => {
    expect(roundHalfAway(-192.5)).toBe(-193);
    expect(roundHalfAway(192.5)).toBe(193);
    expect(roundHalfAway(0)).toBe(0);
  });
});
