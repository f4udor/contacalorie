import type { HealthGate, HealthGateResult, HealthKept, HealthRow } from "./ingest";

export interface FakeActivity {
  steps: number | null;
  stepsSource: "salute" | "manuale" | null;
  km: number | null;
  kmSource: "salute" | null;
  /** Parte a mano della bici: gli invii da Salute non la toccano mai. */
  kmManual?: number | null;
}

/**
 * Ingresso finto in memoria, con le stesse regole della funzione `ingest_health` del database
 * (codici per utente, revoca, limite; i passi sostituiscono anche un valore a mano; la parte a mano della bici è intoccabile). Serve ai test e alle prove senza Supabase.
 */
export function createFakeHealthGate(today: string, yesterday: string): HealthGate & {
  codes: Map<string, { user: string; revoked: boolean }>;
  activity: Map<string, FakeActivity>;
  log: { user: string; success: boolean; detail: string }[];
} {
  const codes = new Map<string, { user: string; revoked: boolean }>();
  const activity = new Map<string, FakeActivity>();
  const log: { user: string; success: boolean; detail: string }[] = [];
  return {
    codes,
    activity,
    log,
    async ingest({ code, rows, limit, discarded, failure }): Promise<HealthGateResult> {
      const c = codes.get(code);
      if (!c || c.revoked) return { status: "unauthorized" };
      if (log.filter((l) => l.user === c.user).length >= limit) return { status: "limit" };
      if (failure !== null) {
        log.push({ user: c.user, success: false, detail: failure });
        return { status: "failed" };
      }
      const saved: HealthRow[] = [];
      const kept: HealthKept[] = [];
      for (const r of rows as HealthRow[]) {
        if (r.date !== today && r.date !== yesterday) continue;
        const key = `${c.user}|${r.date}`;
        const a = activity.get(key) ?? { steps: null, stepsSource: null, km: null, kmSource: null };
        const done: HealthRow = { date: r.date };
        if (r.steps !== undefined && r.steps > 0) {
          a.steps = r.steps;
          a.stepsSource = "salute";
          done.steps = r.steps;
        }
        if (r.km !== undefined && r.km > 0) {
          a.km = r.km;
          a.kmSource = "salute";
          done.km = r.km;
        }
        activity.set(key, a);
        if (done.steps !== undefined || done.km !== undefined) saved.push(done);
      }
      if (saved.length === 0 && kept.length === 0) {
        log.push({ user: c.user, success: false, detail: "Nessuna riga utile" });
        return { status: "failed" };
      }
      log.push({ user: c.user, success: true, detail: `Righe salvate: ${saved.length}, lasciate: ${kept.length}, scartate: ${discarded}` });
      return { status: "ok", saved, kept };
    },
  };
}
