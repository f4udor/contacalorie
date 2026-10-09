import { kcalPerKg, sedentaryFactor } from "./defaults";
import { daysBetween } from "./dates";
import { mergeSettings } from "./settings";
import type { DateKey, Settings } from "./types";

export type Sex = "uomo" | "donna";

/** Il profilo da cui si calcolano gli obiettivi (BRIEF §3.9). Peso: l'ultima pesata, o quello del profilo. */
export interface Profile {
  sex?: Sex | null;
  ageYears?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  targetWeightKg?: number | null;
  /** Data entro cui raggiungere il peso obiettivo. */
  targetDate?: DateKey | null;
}

export interface Plan {
  /** Metabolismo basale (Mifflin-St Jeor), non arrotondato. */
  basal: number;
  /** Il basale arrotondato alla decina: la base del giorno non scende mai sotto questo valore. */
  minimum: number;
  /** Basale × `sedentaryFactor`, non arrotondato. */
  maintenance: number;
  /** Kcal al giorno da togliere (positivo, chi scende) o da aggiungere (negativo, chi sale); 0 senza peso obiettivo o senza data. */
  dailyGap: number;
  /** Kcal base calcolata, arrotondata alla decina. */
  calculatedBaseKcal: number;
  /** Il piano chiede di scendere sotto il minimo: la base resta al minimo. */
  unreachable: boolean;
  /** Se il piano non è raggiungibile: giorni da oggi alla prima data possibile. */
  earliestDays: number | null;
  /** Se il piano non è raggiungibile: la prima data possibile. */
  earliestDate: DateKey | null;
}

const positive = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const roundToTen = (n: number) => Math.round(n / 10) * 10;
/** Arrotonda all'intero con i mezzi lontano dallo zero (−192,5 → −193), come si scrive a mano. */
export const roundHalfAway = (n: number) => Math.sign(n) * Math.round(Math.abs(n));

/** Il profilo basta per calcolare: servono sesso, età, altezza e peso. */
export function isProfileComplete(p: Profile): p is Profile & { sex: Sex; ageYears: number; heightCm: number; weightKg: number } {
  return (p.sex === "uomo" || p.sex === "donna") && positive(p.ageYears) && positive(p.heightCm) && positive(p.weightKg);
}

function addDaysTo(date: DateKey, days: number): DateKey {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Obiettivi calcolati dal profilo (BRIEF §3.9). `null` se il profilo è incompleto. "Oggi" è un parametro: il motore non legge la data.
 * Data già passata (o di oggi) o peso obiettivo già raggiunto: scarto 0.
 */
export function computePlan(profile: Profile, today: DateKey): Plan | null {
  if (!isProfileComplete(profile)) return null;
  const { sex, ageYears, heightCm, weightKg } = profile;
  const basal = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === "uomo" ? 5 : -161);
  const minimum = roundToTen(basal);
  const maintenance = basal * sedentaryFactor;

  const toLose = positive(profile.targetWeightKg) ? weightKg - profile.targetWeightKg : 0;
  const days = profile.targetDate ? daysBetween(today, profile.targetDate) : 0;
  const dailyGap = toLose !== 0 && days > 0 ? (toLose * kcalPerKg) / days : 0;

  const wanted = maintenance - dailyGap;
  const unreachable = wanted < minimum;
  const room = maintenance - minimum;
  const earliestDays = unreachable && room > 0 ? Math.ceil((toLose * kcalPerKg) / room) : null;
  return {
    basal,
    minimum,
    maintenance,
    dailyGap,
    calculatedBaseKcal: roundToTen(Math.max(minimum, wanted)),
    unreachable,
    earliestDays,
    earliestDate: earliestDays === null ? null : addDaysTo(today, earliestDays),
  };
}

/** Impostazioni complete con la base e la soglia minima risolte. */
export interface ResolvedSettings {
  settings: Settings;
  /** Il piano calcolato, se il profilo è completo. */
  plan: Plan | null;
  /** La kcal base è quella scritta dall'utente (personalizzata) e non quella calcolata. */
  baseIsManual: boolean;
}

/**
 * L'unico punto da cui le regole prendono la kcal base e la soglia minima (BRIEF §3.9):
 * - base = valore scritto a mano, se c'è; altrimenti la kcal base calcolata; con il profilo incompleto, il default;
 * - soglia minima = il basale (arrotondato) se il profilo è completo; altrimenti `floorKcal` (default 1800).
 * Chi ha già una kcal base salvata la tiene come personalizzata. `weightKg` è l'ultima pesata, se c'è: sostituisce il peso del profilo.
 */
export function resolveSettings(partial: Record<string, unknown> | null | undefined, today: DateKey, weightKg?: number | null): ResolvedSettings {
  const merged = mergeSettings(partial);
  const p = (partial ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
  const sex = p.sex === "uomo" || p.sex === "donna" ? p.sex : null;
  const plan = computePlan(
    {
      sex,
      ageYears: num(p.ageYears),
      heightCm: num(p.heightCm),
      weightKg: positive(weightKg) ? weightKg : num(p.weightKg),
      targetWeightKg: num(p.targetWeightKg),
      targetDate: typeof p.targetDate === "string" ? p.targetDate : null,
    },
    today,
  );
  const baseIsManual = positive(num(p.baseKcal));
  return {
    settings: { ...merged, baseKcal: baseIsManual ? merged.baseKcal : (plan?.calculatedBaseKcal ?? merged.baseKcal), floorKcal: plan ? plan.minimum : merged.floorKcal },
    plan,
    baseIsManual,
  };
}
