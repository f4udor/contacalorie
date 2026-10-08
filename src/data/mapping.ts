import type { ActivityRecord, DishBody, FavoriteDish, FavoriteMeal, MealRecord, UserSettings, WeighIn } from "./types";

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
];

const num = (v: unknown): number => (typeof v === "string" ? Number(v) : (v as number));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : num(v));

/** Riga di `settings` → impostazioni (le colonne vuote non compaiono). */
export function rowToSettings(row: Row | null): UserSettings {
  const out: Record<string, number> = {};
  if (!row) return out as UserSettings;
  for (const [key, column] of SETTINGS_COLUMNS) {
    const v = row[column];
    if (v === null || v === undefined) continue;
    out[key] = num(v);
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

export function rowToFavoriteDish(r: Row): FavoriteDish {
  return { id: String(r.id), name: String(r.name), quantity: (r.quantity as string | null | undefined) ?? null, kcal: num(r.kcal), protein: num(r.protein), carbs: num(r.carbs), fat: num(r.fat), fiber: num(r.fiber), salt: num(r.salt) };
}

export function favoriteDishToRow(f: FavoriteDish, userId: string): Row {
  return { id: f.id, user_id: userId, name: f.name, quantity: f.quantity, slot: null, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, salt: f.salt };
}

function bodyFromJson(raw: unknown): DishBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.name !== "string") return null;
  return { name: d.name, quantity: typeof d.quantity === "string" ? d.quantity : null, kcal: num(d.kcal), protein: num(d.protein), carbs: num(d.carbs), fat: num(d.fat), fiber: num(d.fiber), salt: num(d.salt) };
}

export function rowToFavoriteMeal(r: Row): FavoriteMeal {
  const dishes = Array.isArray(r.dishes) ? r.dishes.map(bodyFromJson).filter((d): d is DishBody => d !== null) : [];
  return { id: String(r.id), name: String(r.name), slot: (r.slot as FavoriteMeal["slot"]) ?? null, dishes };
}

export function favoriteMealToRow(f: FavoriteMeal, userId: string): Row {
  return { id: f.id, user_id: userId, name: f.name, slot: f.slot, dishes: f.dishes };
}
