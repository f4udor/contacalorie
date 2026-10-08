/** Data nel formato AAAA-MM-GG, senza ora né fuso. */
export type DateKey = string;

export type MealSlot = "colazione" | "pranzo" | "cena" | "spuntino";

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
  /** Pasto libero: conta al massimo `freeMealCap` nel budget. */
  isFree: boolean;
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
