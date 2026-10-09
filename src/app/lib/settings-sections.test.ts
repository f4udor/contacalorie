import { describe, expect, it } from "vitest";
import { resolveSettings } from "@/engine";
import { buildGoalsView, goalLabel, rowSummaries, sectionFromParam, SECTIONS, sectionHref } from "./settings-sections";

const today = "2026-01-01";
const man = { sex: "uomo" as const, ageYears: 27, heightCm: 180, weightKg: 100 };

describe("pagine di Impostazioni", () => {
  it("l'ordine è Profilo, Obiettivi, Attività, Pasto libero, Dati e, in fondo, Collegamenti", () => {
    expect(SECTIONS.map((s) => s.title)).toEqual(["Profilo", "Obiettivi", "Attività", "Pasto libero", "Dati", "Collegamenti"]);
  });
  it("la pagina viene dall'indirizzo; sconosciuta o assente = l'elenco", () => {
    expect(sectionFromParam("obiettivi")).toBe("obiettivi");
    expect(sectionFromParam("pasto-libero")).toBe("pasto-libero");
    expect(sectionFromParam("boh")).toBeNull();
    expect(sectionFromParam(null)).toBeNull();
    expect(sectionHref("collegamenti")).toBe("/impostazioni?s=collegamenti");
  });
});

describe("riassunti delle righe", () => {
  const summaries = (user: Record<string, unknown>, healthLinked: boolean | null = true, weightKg: number | null = 100) => {
    const r = resolveSettings(user, today, weightKg);
    return rowSummaries({ user, settings: r.settings, profileComplete: r.plan !== null, weightKg, healthLinked });
  };
  it("profilo completo: età e peso; kcal base calcolate; bonus; tetto del pasto libero", () => {
    expect(summaries(man)).toEqual({ profilo: "27 anni · 100 kg", obiettivi: "2.390 kcal", attivita: "Bonus 50 %", "pasto-libero": "800 kcal", dati: "CSV", collegamenti: "Salute collegata" });
  });
  it("profilo incompleto: «Da completare» e kcal predefinite", () => {
    const s = summaries({ ageYears: 27 }, false, null);
    expect(s.profilo).toBe("Da completare");
    expect(s.obiettivi).toBe("2.100 kcal");
    expect(s.collegamenti).toBe("Salute non collegata");
  });
  it("kcal base e tetto scritti a mano; stato di Salute non ancora noto = nessun riassunto", () => {
    const s = summaries({ ...man, baseKcal: 2000, freeMealCap: 700, bonusShare: 0.35 }, null);
    expect(s.obiettivi).toBe("2.000 kcal");
    expect(s["pasto-libero"]).toBe("700 kcal");
    expect(s.attivita).toBe("Bonus 35 %");
    expect(s.collegamenti).toBe("");
  });
});

describe("pagina Obiettivi: calcolato / personalizzato", () => {
  it("scrivendo un numero diventa personalizzato; svuotando torna calcolato", () => {
    expect(goalLabel("", "calcolato")).toBe("calcolato");
    expect(goalLabel("2000", "calcolato")).toBe("personalizzato");
    expect(goalLabel("  ", "predefinito")).toBe("predefinito");
    expect(goalLabel("150", "da calcolare")).toBe("personalizzato");
  });
  it("profilo completo (AB): base 2.140 calcolata, basale (minimo) 2.000, piano raggiungibile", () => {
    const v = buildGoalsView({ ...man, targetWeightKg: 90, targetDate: "2026-10-28" }, today, null);
    expect(v).toMatchObject({ profileComplete: true, baseCalculated: 2140, baseKind: "calcolato", minimum: 2000, earliestDate: null });
    // Grassi: 30 % delle kcal base / 9 = 71,3 → 70 g (a 5 g); proteine 1,8 × 90 = 162 → 160 g.
    expect(v.fatCalculated).toBe(70);
    expect(v.proteinCalculated).toBe(160);
  });
  it("piano non raggiungibile (AC): la prima data possibile (tra 196 giorni) che il pulsante imposta", () => {
    const v = buildGoalsView({ ...man, targetWeightKg: 90, targetDate: "2026-04-11" }, today, null);
    expect(v.earliestDate).toBe("2026-07-16");
    expect(v.baseCalculated).toBe(2000);
  });
  it("profilo incompleto (AH): base predefinita, nessun basale, nessuna data", () => {
    const v = buildGoalsView({ ageYears: 27, heightCm: 180, weightKg: 100 }, today, null);
    expect(v).toMatchObject({ profileComplete: false, baseCalculated: 2100, baseKind: "predefinito", minimum: null, earliestDate: null });
  });
  it("kcal base scritta a mano (AG): le regole usano quella, il calcolato resta mostrato", () => {
    const v = buildGoalsView({ ...man, targetWeightKg: 90, targetDate: "2026-10-28", baseKcal: 2100 }, today, null);
    expect(v.baseCalculated).toBe(2140);
    expect(v.settings.baseKcal).toBe(2100);
    expect(v.minimum).toBe(2000);
  });
  it("senza peso né peso obiettivo le proteine non si calcolano", () => {
    expect(buildGoalsView({}, today, null).proteinCalculated).toBeNull();
    expect(buildGoalsView({ weightKg: 90 }, today, null).proteinCalculated).not.toBeNull();
  });
});
