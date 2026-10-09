import { DEFAULT_SETTINGS, nutrientTargets, resolveSettings } from "@/engine";
import type { DateKey, Settings } from "@/engine";
import type { UserSettings } from "@/data";
import { formatNumber } from "./format";

/** Le pagine di Impostazioni, nell'ordine in cui compaiono; Collegamenti sta staccata in fondo. */
export type SectionId = "profilo" | "obiettivi" | "attivita" | "pasto-libero" | "dati" | "collegamenti";

export const SECTIONS: readonly { id: SectionId; title: string }[] = [
  { id: "profilo", title: "Profilo" },
  { id: "obiettivi", title: "Obiettivi" },
  { id: "attivita", title: "Attività" },
  { id: "pasto-libero", title: "Pasto libero" },
  { id: "dati", title: "Esporta i dati" },
  { id: "collegamenti", title: "Collegamenti" },
];

/** La pagina indicata nell'indirizzo (`?s=obiettivi`); null = l'elenco. */
export function sectionFromParam(param: string | null): SectionId | null {
  return SECTIONS.find((s) => s.id === param)?.id ?? null;
}

/** Indirizzo di una pagina di Impostazioni. */
export const sectionHref = (id: SectionId): string => `/impostazioni?s=${id}`;

/** Il riassunto breve a destra di ogni riga della prima pagina. Vuoto = nessun valore (la riga mostra solo la freccia o niente). */
export function rowSummaries(input: { user: UserSettings; settings: Settings; profileComplete: boolean; weightKg: number | null; healthLinked: boolean | null }): Record<SectionId, string> {
  const { user, settings, weightKg, healthLinked } = input;
  const target = user.targetWeightKg;
  const profile = weightKg === null ? "Da completare" : target !== undefined && target > 0 ? `${formatNumber(weightKg, 1)} kg → ${formatNumber(target, 1)} kg` : `${formatNumber(weightKg, 1)} kg`;
  return {
    profilo: profile,
    obiettivi: `${formatNumber(settings.baseKcal)} kcal`,
    attivita: "",
    "pasto-libero": `${formatNumber(settings.freeMealCap)} kcal`,
    dati: "",
    collegamenti: healthLinked === null ? "" : healthLinked ? "Salute attiva" : "Salute non attiva",
  };
}

/** Da dove viene un valore: calcolato dal profilo, scritto a mano, predefinito (profilo incompleto) o ancora da calcolare (manca il peso). */
export type GoalLabel = "calcolato" | "personalizzato" | "predefinito" | "da calcolare";

/** L'etichetta di un numero degli obiettivi: scrivendo un numero diventa personalizzato, svuotando il campo torna calcolato. */
export function goalLabel(manualText: string, calculated: "calcolato" | "predefinito" | "da calcolare"): GoalLabel {
  return manualText.trim() !== "" ? "personalizzato" : calculated;
}

export interface GoalsView {
  /** Il profilo basta per calcolare (sesso, età, altezza, peso). */
  profileComplete: boolean;
  /** Kcal base calcolata, o il predefinito con il profilo incompleto. */
  baseCalculated: number;
  /** Come si chiama il valore della base quando non è scritto a mano. */
  baseKind: "calcolato" | "predefinito";
  /** Metabolismo basale arrotondato alla decina (la base del giorno non scende sotto questo valore); null con il profilo incompleto. */
  minimum: number | null;
  /** Il piano non è raggiungibile con la data scelta: la prima data possibile (altrimenti null). */
  earliestDate: DateKey | null;
  /** Proteine e grassi dalla formula; le proteine sono null finché manca il peso. */
  proteinCalculated: number | null;
  fatCalculated: number;
  /** Impostazioni usate dalle regole (base e soglia risolte). */
  settings: Settings;
}

/** Tutto ciò che la pagina Obiettivi mostra, dalle impostazioni salvate. `weightKg` è l'ultima pesata, se c'è. */
export function buildGoalsView(user: UserSettings, today: DateKey, weightKg: number | null): GoalsView {
  const resolved = resolveSettings(user as Record<string, unknown>, today, weightKg);
  const { settings, plan } = resolved;
  const weight = weightKg ?? user.weightKg ?? null;
  const targetWeight = user.targetWeightKg ?? null;
  const formula = nutrientTargets(settings.baseKcal, weight ?? 0, { ...settings, proteinGramsManual: null, fatGramsManual: null }, targetWeight);
  return {
    profileComplete: plan !== null,
    baseCalculated: plan?.calculatedBaseKcal ?? DEFAULT_SETTINGS.baseKcal,
    baseKind: plan ? "calcolato" : "predefinito",
    minimum: plan?.minimum ?? null,
    earliestDate: plan?.unreachable ? plan.earliestDate : null,
    proteinCalculated: weight === null && targetWeight === null ? null : formula.protein,
    fatCalculated: formula.fat,
    settings,
  };
}
