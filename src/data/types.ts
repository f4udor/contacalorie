import type { DateKey, Meal, MealSlot, Settings, Sex } from "@/engine";

/** Impostazioni dell'utente: solo i valori che ha cambiato (il resto è default) più il profilo. */
export interface UserSettings extends Partial<Settings> {
  weightKg?: number;
  heightCm?: number;
  ageYears?: number;
  targetWeightKg?: number;
  /** Sesso, per il metabolismo basale (BRIEF §3.9). */
  sex?: Sex;
  /** Data entro cui raggiungere il peso obiettivo (AAAA-MM-GG). */
  targetDate?: DateKey;
  /** Il primo avvio guidato è stato fatto o saltato. */
  onboardingDone?: boolean;
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

/**
 * Attività del giorno (tabella `daily_activity`): una per data.
 * Passi: arrivano da Salute; un vecchio valore con fonte "manuale" si può solo eliminare.
 * Bici: `bikeKm`, `bikeKcalHealth` e `bikeSource` sono la parte di Salute (l'app non li modifica);
 * `bikeKmManual` e `bikeKcalManual` sono la parte a mano (un valore per giorno), che si somma e non è mai toccata dagli invii.
 */
export interface ActivityRecord {
  date: DateKey;
  steps: number | null;
  stepsSource: ActivitySource | null;
  bikeKm: number | null;
  bikeKcalHealth: number | null;
  bikeSource: ActivitySource | null;
  bikeKmManual: number | null;
  bikeKcalManual: number | null;
}

/** Collegamento con Salute: codice personale e stato degli invii (letto dal registro delle chiamate). */
export interface HealthLinkStatus {
  /** Falso se i dati sono solo nel browser: il collegamento richiede l'accesso. */
  supported: boolean;
  /** Esiste un codice attivo. */
  active: boolean;
  /** Quando è stato creato il codice attivo (ISO); null se non c'è. */
  codeCreatedAt: string | null;
  /** Ultimo invio riuscito (ISO). */
  lastSuccessAt: string | null;
  /** Ultimo tentativo, riuscito o no. */
  lastAttempt: { at: string; success: boolean; detail: string | null } | null;
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
