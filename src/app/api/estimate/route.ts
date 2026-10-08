import { createSupabaseAiGate, isSupabaseConfigured, readSupabaseEnv } from "@/data";
import { handleEstimate } from "@/modules/ai";
import { createProviderFromEnv, dailyLimitFromEnv } from "@/modules/ai/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Stima dei pasti da testo. Solo lato server: le credenziali del modello non arrivano mai al browser. */
export async function POST(request: Request): Promise<Response> {
  const supabase = readSupabaseEnv();
  const gate = isSupabaseConfigured(supabase) ? createSupabaseAiGate(supabase.url!.trim(), supabase.anonKey!.trim()) : null;
  const body: unknown = await request.json().catch(() => null);
  const outcome = await handleEstimate(
    { provider: createProviderFromEnv(process.env), gate, dailyLimit: dailyLimitFromEnv(process.env) },
    request.headers.get("authorization"),
    body,
  );
  return Response.json(outcome.body, { status: outcome.status, headers: { "Cache-Control": "no-store" } });
}
