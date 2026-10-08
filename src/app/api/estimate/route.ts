import { createSupabaseAiGate, isSupabaseConfigured, readSupabaseEnv } from "@/data";
import { handleEstimate, isAiAvailable } from "@/modules/ai";
import type { EstimateDeps } from "@/modules/ai";
import { createProviderFromEnv, dailyLimitFromEnv } from "@/modules/ai/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readDeps(): EstimateDeps {
  const supabase = readSupabaseEnv();
  const gate = isSupabaseConfigured(supabase) ? createSupabaseAiGate(supabase.url!.trim(), supabase.anonKey!.trim()) : null;
  return { provider: createProviderFromEnv(process.env), gate, dailyLimit: dailyLimitFromEnv(process.env) };
}

const noStore = { "Cache-Control": "no-store" };

/** Dice se la stima automatica è attiva (nessun dato dell'utente, nessun segreto). */
export async function GET(): Promise<Response> {
  return Response.json({ available: isAiAvailable(readDeps()) }, { headers: noStore });
}

/** Stima dei pasti da testo. Solo lato server: le credenziali del modello non arrivano mai al browser. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const outcome = await handleEstimate(readDeps(), request.headers.get("authorization"), body);
  return Response.json(outcome.body, { status: outcome.status, headers: noStore });
}
