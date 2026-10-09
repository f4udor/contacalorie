import { createSupabaseAiGate, isSupabaseConfigured, readSupabaseEnv } from "@/data";
import { fetchUsedToday, handleEstimate, isAiAvailable, providerModelLabel } from "@/modules/ai";
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

/**
 * Dice se la stima automatica è attiva, con il nome leggibile del modello (solo il nome, nessun segreto; «Modello di prova» col provider finto),
 * il limite al giorno e, se la richiesta porta il token dell'utente, le stime fatte oggi. Nessun altro dato.
 */
export async function GET(request?: Request): Promise<Response> {
  const deps = readDeps();
  const supabase = readSupabaseEnv();
  const token = request?.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
  const usedToday = deps.gate && isSupabaseConfigured(supabase) && token ? await fetchUsedToday({ url: supabase.url!.trim(), anonKey: supabase.anonKey!.trim(), token }) : null;
  return Response.json({ available: isAiAvailable(deps), model: providerModelLabel(deps.provider), limit: deps.dailyLimit, usedToday }, { headers: noStore });
}

/** Stima dei pasti da testo. Solo lato server: le credenziali del modello non arrivano mai al browser. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const outcome = await handleEstimate(readDeps(), request.headers.get("authorization"), body);
  return Response.json(outcome.body, { status: outcome.status, headers: noStore });
}
