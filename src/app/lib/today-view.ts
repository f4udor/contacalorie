import { dayTarget, kcalBudget, kcalEaten, lightCeiling, lightKcalRing, lightMinimum, lightRange, nutrientTargets } from "@/engine";
import type { DateKey, Day, Light, RingColor, Settings } from "@/engine";
import type { WeighIn } from "@/data";

export type NutrientKey = "protein" | "carbs" | "fat" | "fiber" | "salt";

export interface NutrientView {
  key: NutrientKey;
  name: string;
  /** Quantità assunta, in grammi. */
  taken: number;
  /** Nessun pasto nel giorno: la scheda mostra "–" invece di 0. */
  empty: boolean;
  /** Obiettivo in grammi; null se manca il peso per calcolarlo. */
  target: number | null;
  decimals: number;
  light: Light;
  /** Avanzamento della barretta, da 0 a 1. */
  progress: number;
  /** Manca il peso: la scheda invita a inserirlo. */
  needsWeight: boolean;
}

export interface CompositionEntry {
  label: string;
  /** Valore in kcal. */
  amount: number;
  /** Mostrare il segno esplicito (+/−). */
  signed: boolean;
}

/** La riga di composizione dell'obiettivo ha senso solo se oltre alla base c'è bici, passi o recupero. */
export function hasCompositionDetail(composition: readonly CompositionEntry[]): boolean {
  return composition.length > 1;
}

export interface TodayView {
  hasMeals: boolean;
  /** Obiettivo kcal del giorno. */
  target: number;
  /** Kcal reali mangiate. */
  eaten: number;
  /** Kcal contate nel budget (pasto libero col tetto). */
  budget: number;
  /** Kcal rimaste: negativo se si è sopra l'obiettivo. */
  remaining: number;
  ringColor: RingColor;
  /** Avanzamento dell'anello, da 0 a 1. */
  ringProgress: number;
  composition: CompositionEntry[];
  nutrients: NutrientView[];
  weightKg: number | null;
}

/** Peso per le proteine: ultima pesata fino a quel giorno; altrimenti peso del profilo; altrimenti la prima pesata successiva. */
export function currentWeight(weighIns: readonly WeighIn[], date: DateKey, profileWeightKg: number | undefined): number | null {
  const sorted = [...weighIns].sort((a, b) => a.date.localeCompare(b.date));
  const upTo = sorted.filter((w) => w.date <= date);
  if (upTo.length > 0) return upTo[upTo.length - 1].weightKg;
  if (profileWeightKg !== undefined && profileWeightKg > 0) return profileWeightKg;
  return sorted.length > 0 ? sorted[0].weightKg : null;
}

function progressOf(x: number, target: number | null): number {
  if (target === null || target <= 0) return 0;
  return Math.max(0, Math.min(x / target, 1));
}

/** Tutto ciò che la parte alta di Oggi mostra, calcolato dal motore. */
export function buildTodayView(input: {
  date: DateKey;
  days: readonly Day[];
  settings: Settings;
  weightKg: number | null;
  /** Peso obiettivo del profilo: se c'è, le proteine si calcolano su quello. */
  targetWeightKg?: number | null;
}): TodayView {
  const { date, days, settings, weightKg } = input;
  const targetWeightKg = input.targetWeightKg ?? null;
  const hasTargetWeight = targetWeightKg !== null && targetWeightKg > 0;
  const day = days.find((d) => d.date === date);
  const meals = day?.meals ?? [];
  const hasMeals = meals.length > 0;

  const t = dayTarget(date, days, settings);
  const eaten = kcalEaten(meals);
  const budget = kcalBudget(meals, settings);

  const composition: CompositionEntry[] = [{ label: "Base", amount: settings.baseKcal, signed: false }];
  const recovery = Math.round(t.base - settings.baseKcal);
  if (t.bikeBonus !== 0) composition.push({ label: "bici", amount: t.bikeBonus, signed: true });
  if (t.stepsBonus !== 0) composition.push({ label: "passi", amount: t.stepsBonus, signed: true });
  if (recovery !== 0) composition.push({ label: "recupero", amount: recovery, signed: true });

  const needsWeight = weightKg === null && !hasTargetWeight && settings.proteinGramsManual === null;
  const goals = nutrientTargets(t.total, weightKg ?? 0, settings, targetWeightKg);

  const taken: Record<NutrientKey, number> = { protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 };
  for (const m of meals) {
    taken.protein += m.protein;
    taken.carbs += m.carbs;
    taken.fat += m.fat;
    taken.fiber += m.fiber;
    taken.salt += m.salt;
  }

  const make = (key: NutrientKey, name: string, decimals: number, kind: "min" | "range" | "ceiling", dependsOnWeight: boolean): NutrientView => {
    const blocked = needsWeight && dependsOnWeight;
    const target = blocked ? null : goals[key];
    let light: Light = "neutro";
    if (hasMeals && target !== null) {
      light = kind === "min" ? lightMinimum(taken[key], target, settings) : kind === "range" ? lightRange(taken[key], target, settings) : lightCeiling(taken[key], target, settings);
    }
    return { key, name, taken: taken[key], empty: !hasMeals, target, decimals, light, progress: progressOf(taken[key], target), needsWeight: blocked };
  };

  return {
    hasMeals,
    target: t.total,
    eaten,
    budget,
    remaining: t.total - budget,
    ringColor: lightKcalRing(budget, t.total),
    ringProgress: progressOf(budget, t.total),
    composition,
    nutrients: [
      make("protein", "Proteine", 0, "min", true),
      make("carbs", "Carboidrati", 0, "range", true),
      make("fat", "Grassi", 0, "range", false),
      make("fiber", "Fibre", 0, "min", false),
      make("salt", "Sale", 1, "ceiling", false),
    ],
    weightKg,
  };
}
