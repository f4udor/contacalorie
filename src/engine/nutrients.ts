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
  "proteinPerKg" | "fatShare" | "baseKcal" | "fiberMin" | "saltMax" | "proteinGramsManual" | "fatGramsManual"
>;

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

/**
 * Obiettivi dei nutrienti (§3.4) dato l'obiettivo kcal del giorno e il peso.
 * I grammi manuali di proteine e grassi sostituiscono la formula.
 * I carboidrati assorbono la differenza e non sono mai negativi.
 */
export function nutrientTargets(dayKcal: number, weightKg: number, settings: NutrientSettings): NutrientTargets {
  const protein = settings.proteinGramsManual ?? roundTo5(settings.proteinPerKg * weightKg);
  const fat = settings.fatGramsManual ?? roundTo5((settings.fatShare * settings.baseKcal) / KCAL_PER_G_FAT);
  const carbs = Math.max(
    0,
    Math.round((dayKcal - protein * KCAL_PER_G_PROTEIN - fat * KCAL_PER_G_FAT) / KCAL_PER_G_CARBS),
  );
  return { protein, carbs, fat, fiber: settings.fiberMin, salt: settings.saltMax };
}
