import type { DateKey } from "@/engine";
import { DataStoreError, MESSAGE_NOT_SIGNED_IN, MESSAGE_READ_FAILED, MESSAGE_WRITE_FAILED } from "./errors";
import {
  activityToRow,
  challengeEntryToRow,
  mealToRow,
  rowToActivity,
  rowToChallengeEntry,
  rowToMeal,
  rowToSettings,
  rowToWeighIn,
  settingsToRow,
  weighInToRow,
} from "./mapping";
import type { DataStore } from "./store";
import type { ActivityRecord, ChallengeLogEntry, MealRecord, StoredData, UserSettings, WeighIn } from "./types";
import { STORAGE_VERSION } from "./types";

type Row = Record<string, unknown>;
interface QueryResult {
  data: Row[] | null;
  error: { message: string } | null;
}

/** La parte del client Supabase che serve allo sportello (permette un finto nei test). */
export interface SupabaseQuery extends PromiseLike<QueryResult> {
  eq(column: string, value: unknown): SupabaseQuery;
  gte(column: string, value: unknown): SupabaseQuery;
  lte(column: string, value: unknown): SupabaseQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseQuery;
  range(from: number, to: number): SupabaseQuery;
}

export interface SupabaseTable {
  select(columns?: string): SupabaseQuery;
  upsert(rows: Row | Row[], options?: { onConflict?: string }): PromiseLike<{ error: { message: string } | null }>;
  delete(): SupabaseQuery;
}

export interface SupabaseLike {
  from(table: string): SupabaseTable;
  auth: { getSession(): Promise<{ data: { session: { user: { id: string } } | null } }> };
}

/** Id del piano di sistema (inserito da `supabase/migrations/…_piano_iniziale.sql`). */
export const SYSTEM_PLAN_ID = "00000000-0000-4000-8000-000000000001";

/** Sportello dei dati su Supabase. Ogni errore diventa un `DataStoreError` con un messaggio chiaro. */
export class SupabaseDataStore implements DataStore {
  private exercises: Promise<{ idByName: Map<string, string>; nameById: Map<string, string> }> | null = null;

  constructor(private readonly getClient: () => Promise<SupabaseLike>) {}

  // --- infrastruttura

  private async run<T>(kind: "lettura" | "scrittura", fn: (client: SupabaseLike) => Promise<T>): Promise<T> {
    try {
      return await fn(await this.getClient());
    } catch (e) {
      if (e instanceof DataStoreError) throw e;
      throw new DataStoreError(kind === "lettura" ? MESSAGE_READ_FAILED : MESSAGE_WRITE_FAILED, kind, e);
    }
  }

  private async userId(client: SupabaseLike): Promise<string> {
    const { data } = await client.auth.getSession();
    if (!data.session) throw new DataStoreError(MESSAGE_NOT_SIGNED_IN, "accesso");
    return data.session.user.id;
  }

  private static check(error: { message: string } | null): void {
    if (error) throw new Error(error.message);
  }

  private async rows(client: SupabaseLike, table: string, build: (q: SupabaseQuery) => SupabaseQuery): Promise<Row[]> {
    const res = await build(client.from(table).select("*"));
    SupabaseDataStore.check(res.error);
    return res.data ?? [];
  }

  /** Tutte le righe di una tabella, a pagine (il server ne dà al massimo 1000 per volta). */
  private async allRows(client: SupabaseLike, table: string, orderBy: string): Promise<Row[]> {
    const PAGE = 1000;
    const out: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      const res = await client.from(table).select("*").order(orderBy).range(from, from + PAGE - 1);
      SupabaseDataStore.check(res.error);
      const page = res.data ?? [];
      out.push(...page);
      if (page.length < PAGE) return out;
    }
  }

  private loadExercises() {
    this.exercises ??= this.getClient()
      .then((client) => this.rows(client, "challenge_exercises", (q) => q.eq("plan_id", SYSTEM_PLAN_ID)))
      .then((rows) => ({
        idByName: new Map(rows.map((r) => [String(r.name), String(r.id)])),
        nameById: new Map(rows.map((r) => [String(r.id), String(r.name)])),
      }))
      .catch((e) => {
        this.exercises = null; // riprova alla prossima richiesta
        throw e;
      });
    return this.exercises;
  }

  // --- impostazioni

  getSettings(): Promise<UserSettings> {
    return this.run("lettura", async (c) => {
      const uid = await this.userId(c);
      const rows = await this.rows(c, "settings", (q) => q.eq("user_id", uid));
      return rowToSettings(rows[0] ?? null);
    });
  }

  saveSettings(patch: { [K in keyof UserSettings]?: UserSettings[K] | undefined }): Promise<void> {
    return this.run("scrittura", async (c) => {
      const uid = await this.userId(c);
      const current = rowToSettings((await this.rows(c, "settings", (q) => q.eq("user_id", uid)))[0] ?? null);
      const next: Record<string, unknown> = { ...current };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      const res = await c.from("settings").upsert(settingsToRow(next as UserSettings, uid), { onConflict: "user_id" });
      SupabaseDataStore.check(res.error);
    });
  }

  resetSettings(): Promise<void> {
    return this.run("scrittura", async (c) => {
      const res = await c.from("settings").upsert(settingsToRow({}, await this.userId(c)), { onConflict: "user_id" });
      SupabaseDataStore.check(res.error);
    });
  }

  // --- pasti (piatti)

  listMeals(date: DateKey): Promise<MealRecord[]> {
    return this.run("lettura", async (c) => (await this.rows(c, "meals", (q) => q.eq("date", date).order("created_at"))).map(rowToMeal));
  }

  listMealsBetween(from: DateKey, to: DateKey): Promise<MealRecord[]> {
    return this.run("lettura", async (c) =>
      (await this.rows(c, "meals", (q) => q.gte("date", from).lte("date", to).order("created_at"))).map(rowToMeal),
    );
  }

  saveMeal(meal: MealRecord): Promise<void> {
    return this.run("scrittura", async (c) => {
      const res = await c.from("meals").upsert(mealToRow(meal, await this.userId(c)), { onConflict: "id" });
      SupabaseDataStore.check(res.error);
    });
  }

  deleteMeal(id: string): Promise<void> {
    return this.run("scrittura", async (c) => {
      const res = await c.from("meals").delete().eq("id", id);
      SupabaseDataStore.check(res.error);
    });
  }

  // --- attività

  getActivity(date: DateKey): Promise<ActivityRecord | null> {
    return this.run("lettura", async (c) => {
      const rows = await this.rows(c, "daily_activity", (q) => q.eq("date", date));
      return rows[0] ? rowToActivity(rows[0]) : null;
    });
  }

  listActivityBetween(from: DateKey, to: DateKey): Promise<ActivityRecord[]> {
    return this.run("lettura", async (c) => (await this.rows(c, "daily_activity", (q) => q.gte("date", from).lte("date", to).order("date"))).map(rowToActivity));
  }

  saveActivity(activity: ActivityRecord): Promise<void> {
    return this.run("scrittura", async (c) => {
      const res = await c.from("daily_activity").upsert(activityToRow(activity, await this.userId(c)), { onConflict: "user_id,date" });
      SupabaseDataStore.check(res.error);
    });
  }

  // --- pesate

  listWeighIns(): Promise<WeighIn[]> {
    return this.run("lettura", async (c) => (await this.allRows(c, "weigh_ins", "date")).map(rowToWeighIn));
  }

  saveWeighIn(weighIn: WeighIn): Promise<void> {
    return this.run("scrittura", async (c) => {
      const res = await c.from("weigh_ins").upsert(weighInToRow(weighIn, await this.userId(c)), { onConflict: "user_id,date" });
      SupabaseDataStore.check(res.error);
    });
  }

  deleteWeighIn(date: DateKey): Promise<void> {
    return this.run("scrittura", async (c) => {
      const res = await c.from("weigh_ins").delete().eq("date", date);
      SupabaseDataStore.check(res.error);
    });
  }

  // --- registro della sfida

  listChallengeLog(date: DateKey): Promise<ChallengeLogEntry[]> {
    return this.listChallengeLogBetween(date, date);
  }

  listChallengeLogBetween(from: DateKey, to: DateKey): Promise<ChallengeLogEntry[]> {
    return this.run("lettura", async (c) => {
      const { nameById } = await this.loadExercises();
      const rows = await this.rows(c, "challenge_log", (q) => q.gte("date", from).lte("date", to).order("date"));
      return rows.map((r) => rowToChallengeEntry(r, nameById)).filter((e): e is ChallengeLogEntry => e !== null);
    });
  }

  saveChallengeEntry(entry: ChallengeLogEntry): Promise<void> {
    return this.run("scrittura", async (c) => {
      const uuid = (await this.loadExercises()).idByName.get(entry.exerciseId);
      if (!uuid) throw new Error(`Esercizio sconosciuto: ${entry.exerciseId}`);
      const res = await c.from("challenge_log").upsert(challengeEntryToRow(entry, await this.userId(c), uuid), { onConflict: "user_id,date,exercise_id" });
      SupabaseDataStore.check(res.error);
    });
  }

  deleteChallengeEntry(date: DateKey, exerciseId: string): Promise<void> {
    return this.run("scrittura", async (c) => {
      const uuid = (await this.loadExercises()).idByName.get(exerciseId);
      if (!uuid) return;
      const res = await c.from("challenge_log").delete().eq("date", date).eq("exercise_id", uuid);
      SupabaseDataStore.check(res.error);
    });
  }

  // --- tutti i dati

  exportAll(): Promise<StoredData> {
    return this.run("lettura", async (c) => {
      const uid = await this.userId(c);
      const { nameById } = await this.loadExercises();
      const [settings, meals, activity, weighIns, log] = await Promise.all([
        this.rows(c, "settings", (q) => q.eq("user_id", uid)),
        this.allRows(c, "meals", "created_at"),
        this.allRows(c, "daily_activity", "date"),
        this.allRows(c, "weigh_ins", "date"),
        this.allRows(c, "challenge_log", "date"),
      ]);
      return {
        version: STORAGE_VERSION,
        settings: rowToSettings(settings[0] ?? null),
        meals: meals.map(rowToMeal),
        activity: activity.map(rowToActivity),
        weighIns: weighIns.map(rowToWeighIn),
        challengeLog: log.map((r) => rowToChallengeEntry(r, nameById)).filter((e): e is ChallengeLogEntry => e !== null),
      };
    });
  }

  // --- avvisi (nessuno: gli errori arrivano come eccezioni)

  async getNotice(): Promise<string | null> {
    return null;
  }

  async clearNotice(): Promise<void> {}
}
