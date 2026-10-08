import { HEALTH_DAILY_CALL_LIMIT, HEALTH_TIME_ZONE } from "./config";
import { parseHealthField } from "./parse";
import type { HealthDiscard, HealthEntry } from "./parse";

/** Una riga da scrivere: la data e, per ciascun campo, il valore (assente = non toccare). */
export interface HealthRow {
  date: string;
  steps?: number;
  km?: number;
}

export interface HealthKept {
  date: string;
  campo: "passi" | "bici_km";
}

/** Risposta della funzione del database che riconosce il codice e scrive. */
export type HealthGateResult =
  | { status: "unauthorized" }
  | { status: "limit" }
  /** Chiamata registrata come non riuscita (corpo non utilizzabile). */
  | { status: "failed" }
  | { status: "ok"; saved: HealthRow[]; kept: HealthKept[] };

/** Ingresso sul database: riconosce l'utente dal codice personale, applica il limite giornaliero, scrive e registra la chiamata. */
export interface HealthGate {
  ingest(args: { code: string; rows: HealthRow[]; limit: number; discarded: number; failure: string | null }): Promise<HealthGateResult>;
}

export interface HealthDeps {
  /** Null se Supabase non è configurato. */
  gate: HealthGate | null;
  /** L'istante della chiamata (il motore e i moduli non leggono l'ora da soli). */
  now: Date;
  dailyLimit?: number;
}

export interface HealthBody {
  ok: boolean;
  messaggio?: string;
  salvate?: { data: string; passi?: number; bici_km?: number }[];
  lasciate_manuali?: { data: string; campo: string; motivo: string }[];
  scartate?: HealthDiscard[];
}

export interface HealthOutcome {
  status: number;
  body: HealthBody;
}

/** Stesso messaggio per codice assente, sbagliato o revocato: non si dice quale. */
const UNAUTHORIZED = "Codice non valido.";

const fail = (status: number, messaggio: string): HealthOutcome => ({ status, body: { ok: false, messaggio } });

/** Data aaaa-MM-gg di un istante nel fuso di configurazione. */
export function dateInZone(now: Date, timeZone: string = HEALTH_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function previousDay(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/** Oggi e ieri nel fuso di configurazione. */
export function keptDays(now: Date): { today: string; yesterday: string } {
  const today = dateInZone(now);
  return { today, yesterday: previousDay(today) };
}

function bearer(authorization: string | null): string | null {
  return authorization?.match(/^Bearer\s+(\S.*)$/i)?.[1]?.trim() || null;
}

/** Unisce le righe dei due campi per data; per una data ripetuta vale l'ultimo valore. */
function mergeRows(steps: HealthEntry[], km: HealthEntry[]): HealthRow[] {
  const byDate = new Map<string, HealthRow>();
  const row = (date: string) => {
    if (!byDate.has(date)) byDate.set(date, { date });
    return byDate.get(date)!;
  };
  for (const e of steps) row(e.date).steps = e.value;
  for (const e of km) row(e.date).km = e.value;
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Gestisce una chiamata dell'ingresso dei dati da Salute. */
export async function handleHealthIngest(deps: HealthDeps, authorization: string | null, body: unknown): Promise<HealthOutcome> {
  const code = bearer(authorization);
  if (!deps.gate) return fail(503, "Collegamento con Salute non disponibile.");
  if (!code) return fail(401, UNAUTHORIZED);
  const limit = deps.dailyLimit ?? HEALTH_DAILY_CALL_LIMIT;

  const call = async (rows: HealthRow[], discarded: number, failure: string | null): Promise<HealthGateResult | HealthOutcome> => {
    try {
      return await deps.gate!.ingest({ code, rows, limit, discarded, failure });
    } catch {
      return fail(503, "Servizio momentaneamente non raggiungibile: riprova.");
    }
  };
  const gateError = (r: HealthGateResult | HealthOutcome): r is HealthOutcome => typeof r.status === "number";
  const refusal = (r: HealthGateResult): HealthOutcome | null =>
    r.status === "unauthorized" ? fail(401, UNAUTHORIZED) : r.status === "limit" ? fail(429, `Troppe chiamate oggi: il limite è ${limit} al giorno. Riprova domani.`) : null;

  const o = typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  const hasField = o !== null && ((o.passi !== undefined && o.passi !== null) || (o.bici_km !== undefined && o.bici_km !== null));
  if (!hasField) {
    const reason = o === null ? "Il corpo non è un JSON leggibile." : "Il corpo è vuoto: servono `passi` e/o `bici_km`.";
    const r = await call([], 0, reason);
    if (gateError(r)) return r;
    return refusal(r) ?? fail(400, reason);
  }

  const steps = parseHealthField("passi", o.passi);
  const km = parseHealthField("bici_km", o.bici_km);
  const { today, yesterday } = keptDays(deps.now);
  const discarded: HealthDiscard[] = [...steps.discarded.map((d) => ({ ...d, riga: `passi: ${d.riga}` })), ...km.discarded.map((d) => ({ ...d, riga: `bici: ${d.riga}` }))];
  const keep = (label: string) => (e: HealthEntry) => {
    if (e.date === today || e.date === yesterday) return true;
    discarded.push({ riga: `${label}: ${e.date};${e.value}`, motivo: "data fuori da oggi e ieri" });
    return false;
  };
  const rows = mergeRows(steps.entries.filter(keep("passi")), km.entries.filter(keep("bici")));

  const r = await call(rows, discarded.length, rows.length === 0 ? "Nessuna riga utile." : null);
  if (gateError(r)) return r;
  const refused = refusal(r);
  if (refused) return refused;
  if (r.status !== "ok") return { status: 200, body: { ok: false, messaggio: "Nessuna riga utile: niente è stato salvato.", scartate: discarded } };

  return {
    status: 200,
    body: {
      ok: true,
      salvate: r.saved.map((s) => ({ data: s.date, ...(s.steps !== undefined ? { passi: s.steps } : {}), ...(s.km !== undefined ? { bici_km: s.km } : {}) })),
      lasciate_manuali: r.kept.map((k) => ({ data: k.date, campo: k.campo, motivo: "Valore inserito a mano: non viene sovrascritto." })),
      scartate: discarded,
    },
  };
}
