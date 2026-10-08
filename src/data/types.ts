import type { DateKey, Meal, Settings } from "@/engine";

/** Impostazioni dell'utente: solo i valori che ha cambiato (il resto è default) più il profilo. */
export interface UserSettings extends Partial<Settings> {
  weightKg?: number;
  heightCm?: number;
  ageYears?: number;
  targetWeightKg?: number;
  /** Data di inizio della sfida mattutina. */
  challengeStartDate?: DateKey;
}

/** Pasto salvato (tabella `meals`). */
export interface MealRecord extends Meal {
  date: DateKey;
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

/** Voce del registro della sfida (tabella `challenge_log`): una per data ed esercizio. */
export interface ChallengeLogEntry {
  date: DateKey;
  exerciseId: string;
  status: "fatto" | "saltato";
  /** Ripetizioni modificate dall'utente; null = quelle del piano. */
  reps: number | null;
}

/** Forma dei dati salvati. `version` serve a migrare il formato in futuro. */
export interface StoredData {
  version: number;
  settings: UserSettings;
  meals: MealRecord[];
  activity: ActivityRecord[];
  weighIns: WeighIn[];
  challengeLog: ChallengeLogEntry[];
}

export const STORAGE_VERSION = 1;
