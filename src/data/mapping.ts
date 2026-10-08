import type { ActivityRecord, ChallengeLogEntry, MealRecord, UserSettings, WeighIn } from "./types";

type Row = Record<string, unknown>;

/** Campi delle impostazioni e colonne della tabella `settings`. */
export const SETTINGS_COLUMNS: readonly (readonly [keyof UserSettings, string])[] = [
  ["weightKg", "weight_kg"],
  ["heightCm", "height_cm"],
  ["ageYears", "age_years"],
  ["targetWeightKg", "target_weight_kg"],
  ["baseKcal", "base_kcal"],
  ["floorKcal", "floor_kcal"],
  ["bonusShare", "bonus_share"],
  ["kcalPerKm", "kcal_per_km"],
  ["kcalPerStep", "kcal_per_step"],
  ["stepThreshold", "step_threshold"],
  ["freeMealCap", "free_meal_cap"],
  ["proteinPerKg", "protein_per_kg"],
  ["proteinPerKgTarget", "protein_per_kg_target"],
  ["fatShare", "fat_share"],
  ["fiberMin", "fiber_min"],
  ["saltMax", "salt_max"],
  ["margin", "margin"],
  ["overLimit", "over_limit"],
  ["proteinGramsManual", "protein_grams_manual"],
  ["fatGramsManual", "fat_grams_manual"],
  ["challengeStartDate", "challenge_start_date"],
];

const num = (v: unknown): number => (typeof v === "string" ? Number(v) : (v as number));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : num(v));

/** Riga di `settings` → impostazioni (le colonne vuote non compaiono). */
export function rowToSettings(row: Row | null): UserSettings {
  const out: Record<string, number | string> = {};
  if (!row) return out as UserSettings;
  for (const [key, column] of SETTINGS_COLUMNS) {
    const v = row[column];
    if (v === null || v === undefined) continue;
    out[key] = key === "challengeStartDate" ? String(v) : num(v);
  }
  return out as UserSettings;
}

/** Impostazioni → riga di `settings` (tutte le colonne note; le assenti a null). */
export function settingsToRow(s: UserSettings, userId: string): Row {
  const row: Row = { user_id: userId, updated_at: new Date().toISOString() };
  for (const [key, column] of SETTINGS_COLUMNS) row[column] = (s as Record<string, unknown>)[key] ?? null;
  return row;
}

export function rowToMeal(r: Row): MealRecord {
  return {
    id: String(r.id),
    date: String(r.date),
    slot: r.slot as MealRecord["slot"],
    name: String(r.name),
    quantity: (r.quantity as string | null | undefined) ?? null,
    kcal: num(r.kcal),
    protein: num(r.protein),
    carbs: num(r.carbs),
    fat: num(r.fat),
    fiber: num(r.fiber),
    salt: num(r.salt),
    isFree: Boolean(r.is_free),
    originalText: (r.original_text as string | null | undefined) ?? null,
  };
}

export function mealToRow(m: MealRecord, userId: string): Row {
  return {
    id: m.id,
    user_id: userId,
    date: m.date,
    slot: m.slot,
    name: m.name,
    quantity: m.quantity ?? null,
    kcal: m.kcal,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    fiber: m.fiber,
    salt: m.salt,
    is_free: m.isFree,
    original_text: m.originalText,
  };
}

export function rowToActivity(r: Row): ActivityRecord {
  return {
    date: String(r.date),
    steps: numOrNull(r.steps),
    stepsSource: (r.steps_source as ActivityRecord["stepsSource"]) ?? null,
    bikeKm: numOrNull(r.bike_km),
    bikeKcalHealth: numOrNull(r.bike_kcal_health),
    bikeSource: (r.bike_source as ActivityRecord["bikeSource"]) ?? null,
  };
}

export function activityToRow(a: ActivityRecord, userId: string): Row {
  return {
    user_id: userId,
    date: a.date,
    steps: a.steps,
    steps_source: a.stepsSource,
    bike_km: a.bikeKm,
    bike_kcal_health: a.bikeKcalHealth,
    bike_source: a.bikeSource,
    updated_at: new Date().toISOString(),
  };
}

export const rowToWeighIn = (r: Row): WeighIn => ({ date: String(r.date), weightKg: num(r.weight_kg) });
export const weighInToRow = (w: WeighIn, userId: string): Row => ({ user_id: userId, date: w.date, weight_kg: w.weightKg });

/** Voce del registro della sfida: nel database l'esercizio è un id, qui il suo nome nel piano. */
export function rowToChallengeEntry(r: Row, nameById: ReadonlyMap<string, string>): ChallengeLogEntry | null {
  const exerciseId = nameById.get(String(r.exercise_id));
  if (exerciseId === undefined) return null;
  return { date: String(r.date), exerciseId, status: r.status as ChallengeLogEntry["status"], reps: numOrNull(r.reps) };
}

export function challengeEntryToRow(e: ChallengeLogEntry, userId: string, exerciseUuid: string): Row {
  return { user_id: userId, date: e.date, exercise_id: exerciseUuid, status: e.status, reps: e.reps };
}
