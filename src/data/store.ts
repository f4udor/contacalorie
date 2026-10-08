import type { DateKey } from "@/engine";
import type { ActivityRecord, ChallengeLogEntry, MealRecord, UserSettings, WeighIn } from "./types";

/**
 * Unico punto d'accesso ai dati per le schermate.
 * Oggi i dati stanno nel browser; con Supabase cambierà solo l'implementazione.
 * Le liste restituite sono copie: modificarle non modifica i dati salvati.
 */
export interface DataStore {
  getSettings(): Promise<UserSettings>;
  /** Unisce `patch` alle impostazioni; un campo `undefined` viene rimosso (torna al default). */
  saveSettings(patch: { [K in keyof UserSettings]?: UserSettings[K] | undefined }): Promise<void>;
  resetSettings(): Promise<void>;

  /** Pasti di un giorno, nell'ordine di inserimento. */
  listMeals(date: DateKey): Promise<MealRecord[]>;
  /** Pasti tra due date comprese. */
  listMealsBetween(from: DateKey, to: DateKey): Promise<MealRecord[]>;
  /** Crea il pasto o, se l'id esiste già, lo sostituisce. */
  saveMeal(meal: MealRecord): Promise<void>;
  deleteMeal(id: string): Promise<void>;

  getActivity(date: DateKey): Promise<ActivityRecord | null>;
  listActivityBetween(from: DateKey, to: DateKey): Promise<ActivityRecord[]>;
  /** Una sola attività per data: sostituisce quella esistente. */
  saveActivity(activity: ActivityRecord): Promise<void>;

  /** Tutte le pesate, dalla meno recente. */
  listWeighIns(): Promise<WeighIn[]>;
  /** Una sola pesata per data: sostituisce quella esistente. */
  saveWeighIn(weighIn: WeighIn): Promise<void>;
  deleteWeighIn(date: DateKey): Promise<void>;

  listChallengeLog(date: DateKey): Promise<ChallengeLogEntry[]>;
  listChallengeLogBetween(from: DateKey, to: DateKey): Promise<ChallengeLogEntry[]>;
  /** Una sola voce per data ed esercizio: sostituisce quella esistente. */
  saveChallengeEntry(entry: ChallengeLogEntry): Promise<void>;
  deleteChallengeEntry(date: DateKey, exerciseId: string): Promise<void>;

  /** Messaggio da mostrare se al caricamento i dati erano illeggibili o non salvabili; null se tutto bene. */
  getNotice(): Promise<string | null>;
  clearNotice(): Promise<void>;
}
