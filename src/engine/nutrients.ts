import type { Settings } from "./types";

export interface NutrientTargets {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
}

type NutrientSettings = Pick<
  Settings,
  "proteinPerKg" | "proteinPerKgTarget" | "fatShare" | "baseKcal" | "fiberMin" | "saltMax" | "proteinGramsManual" | "fatGramsManual"
>;

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

/**
 * Obiettivi dei nutrienti (§3.4) dato l'obiettivo kcal del giorno, il peso e il peso obiettivo.
 * Proteine: con un peso obiettivo valido `proteinPerKgTarget × peso obiettivo`, altrimenti `proteinPerKg × peso`,
 * arrotondate ai 5 g; i grammi manuali di proteine e grassi sostituiscono sempre la formula.
 * I carboidrati assorbono la differenza e non sono mai negativi.
 */
export function nutrientTargets(
  dayKcal: number,
  weightKg: number,
  settings: NutrientSettings,
  targetWeightKg: number | null = null,
): NutrientTargets {
  const hasTarget = targetWeightKg !== null && Number.isFinite(targetWeightKg) && targetWeightKg > 0;
  const formula = hasTarget ? settings.proteinPerKgTarget * targetWeightKg : settings.proteinPerKg * weightKg;
  const protein = settings.proteinGramsManual ?? roundTo5(formula);
  const fat = settings.fatGramsManual ?? roundTo5((settings.fatShare * settings.baseKcal) / KCAL_PER_G_FAT);
  const carbs = Math.max(
    0,
    Math.round((dayKcal - protein * KCAL_PER_G_PROTEIN - fat * KCAL_PER_G_FAT) / KCAL_PER_G_CARBS),
  );
  return { protein, carbs, fat, fiber: settings.fiberMin, salt: settings.saltMax };
}
