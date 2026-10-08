/** Controllo dell'accesso e del limite giornaliero delle stime AI, sul database dell'utente (usato solo dal server). */

interface GateClient {
  auth: { getUser(token: string): Promise<{ data: { user: { id: string } | null }; error: unknown }> };
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

type MakeClient = (token: string) => Promise<GateClient>;

export class SupabaseAiGate {
  constructor(private readonly makeClient: MakeClient) {}

  async verify(token: string): Promise<boolean> {
    const { data, error } = await (await this.makeClient(token)).auth.getUser(token);
    return !error && data.user !== null;
  }

  /** Vero se la stima rientra nel limite di oggi (e viene contata). */
  async consume(token: string, limit: number): Promise<boolean> {
    const { data, error } = await (await this.makeClient(token)).rpc("use_ai_estimate", { p_limit: limit });
    if (error || typeof data !== "number") throw new Error("Conteggio delle stime non riuscito");
    return data >= 0;
  }
}

/** Il controllo con il client Supabase vero: ogni richiesta porta il token dell'utente, così valgono le sue regole di sicurezza. */
export function createSupabaseAiGate(url: string, anonKey: string): SupabaseAiGate {
  return new SupabaseAiGate(async (token) => {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }) as unknown as GateClient;
  });
}
