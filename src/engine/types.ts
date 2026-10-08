/** Data nel formato AAAA-MM-GG, senza ora né fuso. */
export type DateKey = string;

export type MealSlot = "colazione" | "pranzo" | "cena" | "spuntino";

/** Le fasce nell'ordine in cui si mostrano. */
export const MEAL_SLOTS: readonly MealSlot[] = ["colazione", "pranzo", "cena", "spuntino"];

/**
 * Un piatto. I piatti dello stesso giorno e della stessa fascia formano un pasto (`MealGroup`).
 * Il nome `Meal` resta per compatibilità con lo schema del database (tabella `meals`: una riga per piatto).
 */
export interface Meal {
  id: string;
  name: string;
  slot: MealSlot;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
  /** Segna il pasto come libero. Sta su tutti i piatti del pasto; un pasto è libero se almeno un suo piatto lo è. */
  isFree: boolean;
}

/** Un pasto: i piatti di una fascia in un giorno, con i totali. */
export interface MealGroup {
  slot: MealSlot;
  dishes: Meal[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
  isFree: boolean;
}

/** Identifica un pasto: giorno e fascia. */
export interface MealKey {
  date: DateKey;
  slot: MealSlot;
}

export interface Activity {
  /** Passi del giorno; null se assenti. */
  steps: number | null;
  /** Km in bici; null se assenti. */
  bikeKm: number | null;
  /** Kcal della bici registrate da Salute; null se assenti. */
  bikeKcalHealth: number | null;
}

export interface Day {
  date: DateKey;
  meals: Meal[];
  activity: Activity;
  /** Sfida mattutina completata in questo giorno. */
  challengeDone?: boolean;
}

export interface Settings {
  baseKcal: number;
  floorKcal: number;
  bonusShare: number;
  kcalPerKm: number;
  kcalPerStep: number;
  stepThreshold: number;
  freeMealCap: number;
  proteinPerKg: number;
  /** Grammi di proteine per kg di peso obiettivo (usato quando il peso obiettivo è impostato). */
  proteinPerKgTarget: number;
  fatShare: number;
  fiberMin: number;
  saltMax: number;
  margin: number;
  overLimit: number;
  /** Grammi di proteine inseriti a mano: se presenti sostituiscono la formula. */
  proteinGramsManual: number | null;
  /** Grammi di grassi inseriti a mano: se presenti sostituiscono la formula. */
  fatGramsManual: number | null;
}
