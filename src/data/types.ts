import type { DateKey, Meal, MealSlot, Settings } from "@/engine";

/** Impostazioni dell'utente: solo i valori che ha cambiato (il resto è default) più il profilo. */
export interface UserSettings extends Partial<Settings> {
  weightKg?: number;
  heightCm?: number;
  ageYears?: number;
  targetWeightKg?: number;
}

/** Piatto salvato (tabella `meals`, una riga per piatto). I piatti di una data e fascia formano un pasto. */
export interface MealRecord extends Meal {
  date: DateKey;
  /** Quantità in testo libero (es. "100 g"); assente o null se non indicata. */
  quantity?: string | null;
  /** Testo dettato o scritto da cui è nata la stima; null per l'inserimento manuale. */
  originalText: string | null;
}

export type ActivitySource = "salute" | "manuale";

/** Attività del giorno (tabella `daily_activity`): una per data. */
export interface ActivityRecord {
  date: DateKey;
  steps: number | null;
  stepsSource: ActivitySource | null;
  bikeKm: number | null;
  bikeKcalHealth: number | null;
  bikeSource: ActivitySource | null;
}

/** Pesata (tabella `weigh_ins`): una per data. */
export interface WeighIn {
  date: DateKey;
  weightKg: number;
}

/** Numeri di un piatto, senza data né fascia: ciò che si salva nei preferiti. */
export interface DishBody {
  name: string;
  /** Quantità in testo libero; null se non indicata. */
  quantity: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
}

/** Piatto preferito (tabella `favorites`). */
export interface FavoriteDish extends DishBody {
  id: string;
}

/** Pasto preferito (tabella `favorite_meals`): un nome, la fascia in cui era e tutti i suoi piatti. */
export interface FavoriteMeal {
  id: string;
  name: string;
  slot: MealSlot | null;
  dishes: DishBody[];
}

/** Forma dei dati salvati. `version` serve a migrare il formato in futuro. */
export interface StoredData {
  version: number;
  settings: UserSettings;
  meals: MealRecord[];
  activity: ActivityRecord[];
  weighIns: WeighIn[];
  favoriteDishes: FavoriteDish[];
  favoriteMeals: FavoriteMeal[];
}

export const STORAGE_VERSION = 1;
