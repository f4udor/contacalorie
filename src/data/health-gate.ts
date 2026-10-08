/** Ingresso dei dati da Salute sul database: il codice personale, senza sessione dell'utente (usato solo dal server). */

interface RpcClient {
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

type MakeClient = () => Promise<RpcClient>;

export interface HealthRowLike {
  date: string;
  steps?: number;
  km?: number;
}

export type HealthRpcResult =
  | { status: "unauthorized" }
  | { status: "limit" }
  | { status: "failed" }
  | { status: "ok"; saved: HealthRowLike[]; kept: { date: string; campo: "passi" | "bici_km" }[] };

export class SupabaseHealthGate {
  constructor(private readonly makeClient: MakeClient) {}

  async ingest(args: { code: string; rows: HealthRowLike[]; limit: number; discarded: number; failure: string | null }): Promise<HealthRpcResult> {
    const client = await this.makeClient();
    const { data, error } = await client.rpc("ingest_health", { p_code: args.code, p_rows: args.rows, p_limit: args.limit, p_discarded: args.discarded, p_failure: args.failure });
    if (error || typeof data !== "object" || data === null) throw new Error("Ingresso non riuscito");
    const d = data as { status?: unknown; saved?: unknown; kept?: unknown };
    if (d.status === "unauthorized" || d.status === "limit" || d.status === "failed") return { status: d.status };
    if (d.status !== "ok") throw new Error("Risposta dell'ingresso non riconosciuta");
    return { status: "ok", saved: (Array.isArray(d.saved) ? d.saved : []) as HealthRowLike[], kept: (Array.isArray(d.kept) ? d.kept : []) as { date: string; campo: "passi" | "bici_km" }[] };
  }
}

/** Il controllo con il client Supabase vero, con la sola chiave pubblica: il database riconosce l'utente dal codice. */
export function createSupabaseHealthGate(url: string, anonKey: string): SupabaseHealthGate {
  return new SupabaseHealthGate(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } }) as unknown as RpcClient;
  });
}
