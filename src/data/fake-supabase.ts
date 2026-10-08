import { DEFAULT_CHALLENGE_PLAN } from "@/engine";
import { SYSTEM_PLAN_ID } from "./supabase";
import type { SupabaseLike, SupabaseQuery, SupabaseTable } from "./supabase";

type Row = Record<string, unknown>;

/** Database finto in memoria, per i test dello sportello Supabase: tabelle, filtri, upsert, errori e rete assente. */
export class FakeSupabaseDb {
  tables = new Map<string, Row[]>();
  /** Utente collegato; null = nessun accesso. */
  userId: string | null = "utente-1";
  /** Se vero, ogni richiesta fallisce come con la rete assente. */
  offline = false;
  /** Se impostato, ogni richiesta risponde con questo errore del server. */
  serverError: string | null = null;
  /** Quante richieste di scrittura sono state accettate. */
  writes = 0;
  private seq = 0;

  constructor() {
    this.tables.set(
      "challenge_exercises",
      DEFAULT_CHALLENGE_PLAN.exercises.map((e, i) => ({ id: `ex-${i + 1}`, plan_id: SYSTEM_PLAN_ID, name: e.name })),
    );
  }

  rows(table: string): Row[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }

  nextSeq(): number {
    return ++this.seq;
  }

  client(): SupabaseLike {
    return {
      from: (table) => new FakeTable(this, table),
      auth: {
        getSession: async () => {
          if (this.offline) throw new TypeError("Failed to fetch");
          return { data: { session: this.userId ? { user: { id: this.userId } } : null } };
        },
      },
    };
  }
}

class FakeTable implements SupabaseTable {
  constructor(
    private readonly db: FakeSupabaseDb,
    private readonly table: string,
  ) {}

  select(): SupabaseQuery {
    return new FakeQuery(this.db, this.table, "select");
  }

  delete(): SupabaseQuery {
    return new FakeQuery(this.db, this.table, "delete");
  }

  async upsert(input: Row | Row[], options?: { onConflict?: string }) {
    if (this.db.offline) throw new TypeError("Failed to fetch");
    if (this.db.serverError) return { error: { message: this.db.serverError } };
    const conflict = (options?.onConflict ?? "id").split(",");
    for (const row of Array.isArray(input) ? input : [input]) {
      const existing = this.db.rows(this.table).find((r) => conflict.every((c) => r[c] === row[c]));
      if (existing) Object.assign(existing, row);
      else this.db.rows(this.table).push({ id: `gen-${this.db.nextSeq()}`, ...row, created_at: this.db.nextSeq() });
    }
    this.db.writes++;
    return { error: null };
  }
}

class FakeQuery implements SupabaseQuery {
  private filters: ((r: Row) => boolean)[] = [];
  private orderBy: string | null = null;

  constructor(
    private readonly db: FakeSupabaseDb,
    private readonly table: string,
    private readonly mode: "select" | "delete",
  ) {}

  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }
  gte(column: string, value: unknown) {
    this.filters.push((r) => (r[column] as string | number) >= (value as string | number));
    return this;
  }
  lte(column: string, value: unknown) {
    this.filters.push((r) => (r[column] as string | number) <= (value as string | number));
    return this;
  }
  order(column: string) {
    this.orderBy = column;
    return this;
  }

  then<R1 = never, R2 = never>(
    onfulfilled?: ((value: { data: Row[] | null; error: { message: string } | null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: Row[] | null; error: { message: string } | null }> {
    if (this.db.offline) throw new TypeError("Failed to fetch");
    if (this.db.serverError) return { data: null, error: { message: this.db.serverError } };
    const all = this.db.rows(this.table);
    const matches = all.filter((r) => this.filters.every((f) => f(r)));
    if (this.mode === "delete") {
      this.db.tables.set(
        this.table,
        all.filter((r) => !matches.includes(r)),
      );
      this.db.writes++;
      return { data: null, error: null };
    }
    const sorted = [...matches];
    if (this.orderBy) {
      const col = this.orderBy;
      sorted.sort((a, b) => (a[col] === b[col] ? 0 : (a[col] as string | number) < (b[col] as string | number) ? -1 : 1));
    }
    return { data: sorted.map((r) => ({ ...r })), error: null };
  }
}
