import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { mergeSettings } from "./settings";

describe("default (BRIEF §3)", () => {
  it("coincidono uno per uno con la tabella", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      baseKcal: 2100,
      floorKcal: 1800,
      bonusShare: 0.5,
      kcalPerKm: 27,
      kcalPerStep: 0.05,
      stepThreshold: 6000,
      freeMealCap: 800,
      proteinPerKg: 1.4,
      proteinPerKgTarget: 1.8,
      fatShare: 0.3,
      fiberMin: 30,
      saltMax: 5,
      margin: 0.1,
      overLimit: 1.5,
      proteinGramsManual: null,
      fatGramsManual: null,
    });
  });
});

describe("mergeSettings", () => {
  it("senza input restituisce i default", () => {
    expect(mergeSettings()).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("applica i valori validi e lascia gli altri ai default", () => {
    const s = mergeSettings({ baseKcal: 2000, margin: 0.2 });
    expect(s.baseKcal).toBe(2000);
    expect(s.margin).toBe(0.2);
    expect(s.floorKcal).toBe(1800);
  });

  it("accetta zero come valore valido", () => {
    expect(mergeSettings({ kcalPerStep: 0 }).kcalPerStep).toBe(0);
  });

  it("valori negativi, non numerici, NaN e infiniti tornano al default", () => {
    const s = mergeSettings({
      baseKcal: -1,
      floorKcal: "1900",
      bonusShare: NaN,
      kcalPerKm: Infinity,
      kcalPerStep: null,
      stepThreshold: undefined,
      freeMealCap: {},
    });
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it("ignora chiavi sconosciute", () => {
    const s = mergeSettings({ pippo: 3 });
    expect(s).toEqual(DEFAULT_SETTINGS);
    expect("pippo" in s).toBe(false);
  });

  it("grammi manuali: numeri non negativi sì, altrimenti null", () => {
    expect(mergeSettings({ proteinGramsManual: 150 }).proteinGramsManual).toBe(150);
    expect(mergeSettings({ fatGramsManual: -5 }).fatGramsManual).toBeNull();
    expect(mergeSettings({ fatGramsManual: "70" }).fatGramsManual).toBeNull();
  });

  it("non modifica i default", () => {
    mergeSettings({ baseKcal: 1 });
    expect(DEFAULT_SETTINGS.baseKcal).toBe(2100);
  });
});

describe("proteinPerKgTarget", () => {
  it("default 1,8 e personalizzabile", () => {
    expect(mergeSettings().proteinPerKgTarget).toBe(1.8);
    expect(mergeSettings({ proteinPerKgTarget: 2 }).proteinPerKgTarget).toBe(2);
    expect(mergeSettings({ proteinPerKgTarget: -1 }).proteinPerKgTarget).toBe(1.8);
  });
});
