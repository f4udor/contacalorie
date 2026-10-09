import { describe, expect, it } from "vitest";
import { resolveSettings } from "@/engine";
import { buildGoalsView, goalLabel, rowSummaries, sectionFromParam, SECTIONS, sectionHref } from "./settings-sections";

const today = "2026-01-01";
const man = { sex: "uomo" as const, ageYears: 27, heightCm: 180, weightKg: 100 };

describe("pagine di Impostazioni", () => {
  it("l'ordine è Profilo, Obiettivi, Attività, Pasto libero, Esporta i dati e, in fondo, Collegamenti", () => {
    expect(SECTIONS.map((s) => s.title)).toEqual(["Profilo", "Obiettivi", "Attività", "Pasto libero", "Esporta i dati", "Collegamenti"]);
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
  it("con peso e obiettivo: «98,6 kg → 90 kg»; kcal base calcolate; Attività senza valore; tetto del pasto libero; Salute attiva", () => {
    expect(summaries({ ...man, targetWeightKg: 90 }, true, 98.6)).toEqual({ profilo: "98,6 kg → 90 kg", obiettivi: "2.380 kcal", attivita: "", "pasto-libero": "800 kcal", dati: "", collegamenti: "Salute attiva" });
  });
  it("senza peso obiettivo: solo il peso; senza peso: «Da completare»", () => {
    expect(summaries(man).profilo).toBe("100 kg");
    expect(summaries({ ageYears: 27 }, false, null).profilo).toBe("Da completare");
  });
  it("profilo incompleto: kcal predefinite; Salute non attiva", () => {
    const s = summaries({ ageYears: 27 }, false, null);
    expect(s.obiettivi).toBe("2.100 kcal");
    expect(s.collegamenti).toBe("Salute non attiva");
  });
  it("kcal base e tetto scritti a mano; stato di Salute non ancora noto = nessun riassunto", () => {
    const s = summaries({ ...man, baseKcal: 2000, freeMealCap: 700 }, null);
    expect(s.obiettivi).toBe("2.000 kcal");
    expect(s["pasto-libero"]).toBe("700 kcal");
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
